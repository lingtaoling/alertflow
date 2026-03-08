import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AlertStatus } from '@prisma/client';
import { CreateAlertDto, UpdateAlertStatusDto, ListAlertsQueryDto } from './dto/alert.dto';
import { PaginatedResult } from '../common/dto/pagination.dto';
import { AlertsGateway } from './alerts.gateway';

// Enforced workflow transitions
const VALID_TRANSITIONS: Record<AlertStatus, AlertStatus[]> = {
  NEW: [AlertStatus.ACKNOWLEDGED],
  ACKNOWLEDGED: [AlertStatus.RESOLVED],
  RESOLVED: [],
};

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly alertsGateway: AlertsGateway,
  ) {}

  /**
   * Create an alert — always scoped to the authenticated user's org.
   * The orgId comes from the TenantGuard, never from user input.
   */
  async create(orgId: string, userId: string, dto: CreateAlertDto) {
    this.logger.log(`Creating alert "${dto.title}" in org ${orgId} by user ${userId}`);

    const alert = await this.prisma.$transaction(async (tx) => {
      // Create the alert (status defaults to NEW in DB)
      const newAlert = await tx.alert.create({
        data: {
          title: dto.title,
          description: dto.description,
          status: AlertStatus.NEW,
          orgId, // Always from guard — tenant isolation enforced here
          createdById: userId,
        },
      });

      // Create the initial audit event
      await tx.alertEvent.create({
        data: {
          alertId: newAlert.id,
          userId,
          fromStatus: null,
          toStatus: AlertStatus.NEW,
          note: 'Alert created',
        },
      });

      return newAlert;
    });

    this.logger.log(`Alert created: ${alert.id}`);
    const full = await this.findOne(orgId, alert.id);
    this.alertsGateway.emitAlertEvent(orgId, 'alert:created', full);
    return full;
  }

  /**
   * List alerts — filtered by orgId for normal users, all orgs for admin.
   * Admin (orgId null): no org filter. Normal: tenant isolation.
   */
  async findAll(orgId: string | null, query: ListAlertsQueryDto): Promise<PaginatedResult<any>> {
    const { limit = 20, offset = 0, status } = query;

    // Build where clause — orgId only for non-admin (tenant isolation)
    const where: any = {};
    if (orgId) {
      where.orgId = orgId;
    }
    if (status) {
      where.status = status;
    }

    const baseWhere = orgId ? { orgId } : {};
    const [data, total, countByStatus] = await Promise.all([
      this.prisma.alert.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          org: { select: { id: true, name: true } },
          _count: { select: { alertEvents: true } },
        },
      }),
      this.prisma.alert.count({ where }),
      this.prisma.alert.groupBy({
        by: ['status'],
        where: baseWhere,
        _count: { status: true },
      }),
    ]);

    const counts = {
      total: countByStatus.reduce((s, r) => s + r._count.status, 0),
      NEW: countByStatus.find((r) => r.status === 'NEW')?._count.status ?? 0,
      ACKNOWLEDGED: countByStatus.find((r) => r.status === 'ACKNOWLEDGED')?._count.status ?? 0,
      RESOLVED: countByStatus.find((r) => r.status === 'RESOLVED')?._count.status ?? 0,
    };

    return {
      data,
      total,
      limit,
      offset,
      hasMore: offset + data.length < total,
      counts,
    };
  }

  /**
   * Get a single alert — enforces org ownership for normal users; admin can access any.
   */
  async findOne(orgId: string | null, alertId: string) {
    const where = orgId ? { id: alertId, orgId } : { id: alertId };
    const alert = await this.prisma.alert.findFirst({
      where,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        org: { select: { id: true, name: true } },
        _count: { select: { alertEvents: true } },
      },
    });

    if (!alert) {
      throw new NotFoundException(`Alert ${alertId} not found`);
    }

    return alert;
  }

  /**
   * Update alert status — validates workflow transitions and creates audit event.
   *
   * Concurrency safety via optimistic locking:
   *   The client sends the `version` it last read. The UPDATE WHERE clause
   *   includes `version = dto.version`, so it only succeeds if nobody else
   *   incremented the version since the client loaded the alert.
   *   If rowCount = 0 → 409 Conflict.
   */
  async updateStatus(orgId: string | null, userId: string, alertId: string, dto: UpdateAlertStatusDto) {
    this.logger.log(`Updating alert ${alertId} status to ${dto.status} by user ${userId} (v${dto.version})`);

    const alertWhere = orgId ? { id: alertId, orgId } : { id: alertId };
    const alert = await this.prisma.alert.findFirst({
      where: alertWhere,
      select: { id: true, status: true, version: true, orgId: true },
    });

    if (!alert) {
      throw new NotFoundException(`Alert ${alertId} not found`);
    }

    // Validate workflow transition
    const allowedNext = VALID_TRANSITIONS[alert.status];
    if (!allowedNext.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition from ${alert.status} to ${dto.status}. ` +
        `Allowed: ${allowedNext.length ? allowedNext.join(', ') : 'none (terminal state)'}`,
      );
    }

    // Atomic version-gated update.
    // updateMany returns { count } without throwing when no row matches.
    const updateWhere = orgId
      ? { id: alertId, orgId, version: dto.version }
      : { id: alertId, version: dto.version };
    const { count } = await this.prisma.$transaction(async (tx) => {
      const result = await tx.alert.updateMany({
        where: updateWhere,
        data: {
          status: dto.status,
          version: { increment: 1 }, // bump so the next concurrent writer loses
        },
      });

      if (result.count === 0) {
        // Another user already changed the alert — version no longer matches
        throw new ConflictException(
          `Alert ${alertId} was already updated by another user. Please refresh and try again.`,
        );
      }

      await tx.alertEvent.create({
        data: {
          alertId,
          userId,
          fromStatus: alert.status,
          toStatus: dto.status,
          note: dto.note,
        },
      });

      return result;
    });

    this.logger.log(`Alert ${alertId}: ${alert.status} → ${dto.status} (v${dto.version} → v${dto.version + 1}, matched ${count} row)`);
    const full = await this.findOne(alert.orgId, alertId);
    this.alertsGateway.emitAlertEvent(alert.orgId, 'alert:updated', full);
    return full;
  }

  /**
   * Get audit events for an alert — enforces org ownership for normal users; admin can access any.
   */
  async getEvents(orgId: string | null, alertId: string) {
    const where = orgId ? { id: alertId, orgId } : { id: alertId };
    const alert = await this.prisma.alert.findFirst({
      where,
      select: { id: true },
    });

    if (!alert) {
      throw new NotFoundException(`Alert ${alertId} not found`);
    }

    return this.prisma.alertEvent.findMany({
      where: { alertId },
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }
}
