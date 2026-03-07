import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AlertStatus } from '@prisma/client';
import { CreateAlertDto, UpdateAlertStatusDto, ListAlertsQueryDto } from './dto/alert.dto';
import { PaginatedResult } from '../common/dto/pagination.dto';

// Enforced workflow transitions
const VALID_TRANSITIONS: Record<AlertStatus, AlertStatus[]> = {
  NEW: [AlertStatus.ACKNOWLEDGED],
  ACKNOWLEDGED: [AlertStatus.RESOLVED],
  RESOLVED: [],
};

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(private readonly prisma: PrismaService) {}

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
    return this.findOne(orgId, alert.id);
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

    const [data, total] = await Promise.all([
      this.prisma.alert.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          _count: { select: { alertEvents: true } },
        },
      }),
      this.prisma.alert.count({ where }),
    ]);

    return {
      data,
      total,
      limit,
      offset,
      hasMore: offset + data.length < total,
    };
  }

  /**
   * Get a single alert — enforces org ownership.
   */
  async findOne(orgId: string, alertId: string) {
    const alert = await this.prisma.alert.findFirst({
      where: {
        id: alertId,
        orgId, // Tenant isolation: can only access alerts in own org
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
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
   */
  async updateStatus(orgId: string, userId: string, alertId: string, dto: UpdateAlertStatusDto) {
    this.logger.log(`Updating alert ${alertId} status to ${dto.status} by user ${userId}`);

    // Fetch with org scope — tenant isolation enforced
    const alert = await this.prisma.alert.findFirst({
      where: { id: alertId, orgId },
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

    // Atomic update + audit event
    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedAlert = await tx.alert.update({
        where: { id: alertId },
        data: { status: dto.status },
      });

      await tx.alertEvent.create({
        data: {
          alertId,
          userId,
          fromStatus: alert.status,
          toStatus: dto.status,
          note: dto.note,
        },
      });

      return updatedAlert;
    });

    this.logger.log(`Alert ${alertId}: ${alert.status} → ${dto.status}`);
    return this.findOne(orgId, alertId);
  }

  /**
   * Get audit events for an alert — enforces org ownership.
   */
  async getEvents(orgId: string, alertId: string) {
    // First verify the alert belongs to this org — tenant isolation
    const alert = await this.prisma.alert.findFirst({
      where: { id: alertId, orgId },
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
