import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

export interface AuthenticatedSocket {
  id: string;
  userId: string;
  orgId: string | null;
  role: string;
}

@WebSocketGateway({
  cors: { origin: '*' },
  path: '/socket.io',
})
export class AlertsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(AlertsGateway.name);
  private readonly connectionAttempts = new Map<string, number[]>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  private getClientIp(client: any): string {
    const forwarded = client.handshake?.headers?.['x-forwarded-for'];
    if (forwarded) {
      return String(forwarded).split(',')[0].trim();
    }
    return client.handshake?.address ?? client.conn?.remoteAddress ?? 'unknown';
  }

  private isRateLimited(ip: string): boolean {
    const ttl = parseInt(this.configService.get<string>('WS_RATE_LIMIT_TTL') ?? '60000', 10);
    const max = parseInt(this.configService.get<string>('WS_RATE_LIMIT_MAX') ?? '10', 10);
    const now = Date.now();
    const cutoff = now - ttl;
    let timestamps = this.connectionAttempts.get(ip) ?? [];
    timestamps = timestamps.filter((t) => t > cutoff);
    if (timestamps.length >= max) {
      return true;
    }
    timestamps.push(now);
    this.connectionAttempts.set(ip, timestamps);
    return false;
  }

  async handleConnection(client: any) {
    try {
      const ip = this.getClientIp(client);
      if (this.isRateLimited(ip)) {
        this.logger.warn(`WebSocket connection rejected: rate limit exceeded for ${ip}`);
        client.disconnect();
        return;
      }

      const token = client.handshake?.auth?.token ?? client.handshake?.query?.token;
      if (!token) {
        this.logger.warn('WebSocket connection rejected: no token');
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      const user = await this.prisma.user.findFirst({
        where: { id: payload.sub },
        select: { id: true, orgId: true, role: true },
      });

      if (!user) {
        this.logger.warn('WebSocket connection rejected: user not found');
        client.disconnect();
        return;
      }

      (client as any).user = {
        userId: user.id,
        orgId: user.orgId,
        role: user.role,
      };

      if (user.orgId) {
        client.join(`org:${user.orgId}`);
      }
      client.join('admin:all');

      this.logger.log(`WebSocket connected: ${client.id} (user ${user.id}, org ${user.orgId ?? 'admin'})`);
    } catch (err) {
      this.logger.warn('WebSocket connection rejected: invalid token');
      client.disconnect();
    }
  }

  handleDisconnect(client: any) {
    this.logger.log(`WebSocket disconnected: ${client.id}`);
  }

  /**
   * Broadcast alert created/updated to the org that owns it. Admin room also receives it.
   */
  emitAlertEvent(orgId: string, event: 'alert:created' | 'alert:updated', payload: unknown) {
    this.server.to(`org:${orgId}`).emit(event, payload);
    this.server.to('admin:all').emit(event, payload);
    this.logger.debug(`Emitted ${event} to org:${orgId}`);
  }
}
