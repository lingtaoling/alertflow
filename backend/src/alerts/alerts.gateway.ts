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

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: any) {
    try {
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
