import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { PrismaService } from '../prisma/prisma.service';
import { AlertsGateway } from './alerts.gateway';
import { AlertStatus } from '@prisma/client';

describe('AlertsService', () => {
  let service: AlertsService;
  let prisma: jest.Mocked<PrismaService>;
  let gateway: jest.Mocked<AlertsGateway>;

  const mockOrgId = 'org-123';
  const mockUserId = 'user-456';
  const mockAlertId = 'alert-789';

  const mockAlert = {
    id: mockAlertId,
    title: 'Test Alert',
    description: 'Test description',
    status: AlertStatus.NEW,
    version: 1,
    orgId: mockOrgId,
    createdById: mockUserId,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: { id: mockUserId, name: 'Test User', email: 'test@example.com' },
    org: { id: mockOrgId, name: 'Test Org' },
    _count: { alertEvents: 1 },
  };

  const mockCountByStatus = [
    { status: 'NEW' as const, _count: { status: 5 } },
    { status: 'ACKNOWLEDGED' as const, _count: { status: 3 } },
    { status: 'RESOLVED' as const, _count: { status: 2 } },
  ];

  beforeEach(async () => {
    const mockPrisma = {
      $transaction: jest.fn((fn: (tx: any) => Promise<any>) => fn(mockPrisma)),
      alert: {
        create: jest.fn().mockResolvedValue(mockAlert),
        findMany: jest.fn().mockResolvedValue([mockAlert]),
        findFirst: jest.fn().mockResolvedValue(mockAlert),
        count: jest.fn().mockResolvedValue(1),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        groupBy: jest.fn().mockResolvedValue(mockCountByStatus),
      },
      alertEvent: {
        create: jest.fn().mockResolvedValue({}),
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    const mockGateway = {
      emitAlertEvent: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AlertsGateway, useValue: mockGateway },
      ],
    }).compile();

    service = module.get<AlertsService>(AlertsService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    gateway = module.get(AlertsGateway) as jest.Mocked<AlertsGateway>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an alert and initial event', async () => {
      const dto = { title: 'New Alert', description: 'Optional desc' };
      const result = await service.create(mockOrgId, mockUserId, dto);

      expect(result).toBeDefined();
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.alert.create).toHaveBeenCalledWith({
        data: {
          title: dto.title,
          description: dto.description,
          status: AlertStatus.NEW,
          orgId: mockOrgId,
          createdById: mockUserId,
        },
      });
      expect(prisma.alertEvent.create).toHaveBeenCalledWith({
        data: {
          alertId: expect.any(String),
          userId: mockUserId,
          fromStatus: null,
          toStatus: AlertStatus.NEW,
          note: 'Alert created',
        },
      });
      expect(gateway.emitAlertEvent).toHaveBeenCalledWith(mockOrgId, 'alert:created', expect.anything());
    });
  });

  describe('findAll', () => {
    it('should return paginated alerts for org', async () => {
      const result = await service.findAll(mockOrgId, { limit: 10, offset: 0 });

      expect(result).toMatchObject({
        data: [mockAlert],
        total: 1,
        limit: 10,
        offset: 0,
        counts: expect.objectContaining({
          total: 10,
          NEW: 5,
          ACKNOWLEDGED: 3,
          RESOLVED: 2,
        }),
      });
      expect(prisma.alert.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { orgId: mockOrgId },
          take: 10,
          skip: 0,
        }),
      );
    });

    it('should filter by status when provided', async () => {
      await service.findAll(mockOrgId, { status: AlertStatus.NEW });

      expect(prisma.alert.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { orgId: mockOrgId, status: AlertStatus.NEW },
        }),
      );
    });

    it('should search by title/description when search provided', async () => {
      await service.findAll(mockOrgId, { search: 'cpu' });

      expect(prisma.alert.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            orgId: mockOrgId,
            OR: [
              { title: { contains: 'cpu', mode: 'insensitive' } },
              { description: { contains: 'cpu', mode: 'insensitive' } },
            ],
          }),
        }),
      );
    });

    it('should allow admin (orgId null) to fetch all orgs', async () => {
      await service.findAll(null, {});

      expect(prisma.alert.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return alert when found', async () => {
      const result = await service.findOne(mockOrgId, mockAlertId);

      expect(result).toEqual(mockAlert);
      expect(prisma.alert.findFirst).toHaveBeenCalledWith({
        where: { id: mockAlertId, orgId: mockOrgId },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException when alert not found', async () => {
      (prisma.alert.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne(mockOrgId, mockAlertId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne(mockOrgId, mockAlertId)).rejects.toThrow(
        `Alert ${mockAlertId} not found`,
      );
    });
  });

  describe('updateStatus', () => {
    it('should transition NEW → ACKNOWLEDGED', async () => {
      (prisma.alert.findFirst as jest.Mock).mockResolvedValue({
        ...mockAlert,
        status: AlertStatus.NEW,
        version: 1,
      });

      const result = await service.updateStatus(mockOrgId, mockUserId, mockAlertId, {
        status: AlertStatus.ACKNOWLEDGED,
        version: 1,
      });

      expect(result).toBeDefined();
      expect(prisma.alert.updateMany).toHaveBeenCalledWith({
        where: { id: mockAlertId, orgId: mockOrgId, version: 1 },
        data: { status: AlertStatus.ACKNOWLEDGED, version: { increment: 1 } },
      });
      expect(prisma.alertEvent.create).toHaveBeenCalledWith({
        data: {
          alertId: mockAlertId,
          userId: mockUserId,
          fromStatus: AlertStatus.NEW,
          toStatus: AlertStatus.ACKNOWLEDGED,
          note: undefined,
        },
      });
      expect(gateway.emitAlertEvent).toHaveBeenCalledWith(mockOrgId, 'alert:updated', expect.anything());
    });

    it('should throw BadRequestException for invalid transition NEW → RESOLVED', async () => {
      (prisma.alert.findFirst as jest.Mock).mockResolvedValue({
        ...mockAlert,
        status: AlertStatus.NEW,
      });

      await expect(
        service.updateStatus(mockOrgId, mockUserId, mockAlertId, {
          status: AlertStatus.RESOLVED,
          version: 1,
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.updateStatus(mockOrgId, mockUserId, mockAlertId, {
          status: AlertStatus.RESOLVED,
          version: 1,
        }),
      ).rejects.toThrow(/Cannot transition from NEW to RESOLVED/);
    });

    it('should throw ConflictException when version mismatch (optimistic lock)', async () => {
      (prisma.alert.findFirst as jest.Mock).mockResolvedValue({
        ...mockAlert,
        status: AlertStatus.NEW,
        version: 1,
      });

      const mockTx = {
        alert: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
        alertEvent: { create: jest.fn().mockResolvedValue({}) },
      };
      (prisma.$transaction as jest.Mock).mockImplementation((fn: (tx: any) => Promise<any>) =>
        fn(mockTx),
      );

      await expect(
        service.updateStatus(mockOrgId, mockUserId, mockAlertId, {
          status: AlertStatus.ACKNOWLEDGED,
          version: 1,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException when alert not found', async () => {
      (prisma.alert.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updateStatus(mockOrgId, mockUserId, mockAlertId, {
          status: AlertStatus.ACKNOWLEDGED,
          version: 1,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getEvents', () => {
    it('should return events for alert', async () => {
      const mockEvents = [
        {
          id: 'ev-1',
          alertId: mockAlertId,
          toStatus: AlertStatus.NEW,
          createdAt: new Date(),
          user: { id: mockUserId, name: 'User', email: 'u@x.com' },
        },
      ];
      (prisma.alert.findFirst as jest.Mock).mockResolvedValue({ id: mockAlertId });
      (prisma.alertEvent.findMany as jest.Mock).mockResolvedValue(mockEvents);

      const result = await service.getEvents(mockOrgId, mockAlertId);

      expect(result).toEqual(mockEvents);
      expect(prisma.alertEvent.findMany).toHaveBeenCalledWith({
        where: { alertId: mockAlertId },
        orderBy: { createdAt: 'asc' },
        include: { user: { select: { id: true, name: true, email: true } } },
      });
    });

    it('should throw NotFoundException when alert not found', async () => {
      (prisma.alert.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.getEvents(mockOrgId, mockAlertId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
