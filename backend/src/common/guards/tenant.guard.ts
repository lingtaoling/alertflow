import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * TenantGuard enforces tenant isolation.
 *
 * It reads X-Org-Id and X-User-Id headers, verifies:
 * 1. Both headers are present
 * 2. The org exists
 * 3. The user belongs to that org
 *
 * Then attaches orgId and userId to request for downstream use.
 * Every database query uses orgId from this guard — never from user input.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  private readonly logger = new Logger(TenantGuard.name);

  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const orgId = request.headers['x-org-id'] as string;
    const userId = request.headers['x-user-id'] as string;

    if (!orgId) {
      throw new UnauthorizedException('Missing X-Org-Id header');
    }
    if (!userId) {
      throw new UnauthorizedException('Missing X-User-Id header');
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(orgId)) {
      throw new BadRequestException('Invalid X-Org-Id format');
    }
    if (!uuidRegex.test(userId)) {
      throw new BadRequestException('Invalid X-User-Id format');
    }

    // Verify user belongs to the org — this is the core tenant isolation check
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        orgId: orgId, // CRITICAL: user must belong to the claimed org
      },
      select: { id: true, orgId: true },
    });

    if (!user) {
      this.logger.warn(`Tenant isolation violation attempt: user ${userId} not in org ${orgId}`);
      throw new UnauthorizedException('User does not belong to this organization');
    }

    // Attach to request for downstream use
    (request as any).orgId = orgId;
    (request as any).userId = userId;

    return true;
  }
}
