import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';
import { AlertStatus } from '@prisma/client';
import { CreateAlertDto, UpdateAlertStatusDto, ListAlertsQueryDto } from './dto/alert.dto';

describe('AlertsController', () => {
  let controller: AlertsController;
  let service: jest.Mocked<AlertsService>;

  const mockAlert = {
    id: 'alert-123',
    title: 'Test Alert',
    description: 'Desc',
    status: AlertStatus.NEW,
    version: 1,
    orgId: 'org-123',
    createdById: 'user-456',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: { id: 'user-456', name: 'User', email: 'u@x.com' },
    org: { id: 'org-123', name: 'Org' },
    _count: { alertEvents: 1 },
  };

  beforeEach(async () => {
    const mockService = {
      create: jest.fn().mockResolvedValue(mockAlert),
      findAll: jest.fn().mockResolvedValue({ data: [mockAlert], total: 1, limit: 20, offset: 0, hasMore: false, counts: {} }),
      findOne: jest.fn().mockResolvedValue(mockAlert),
      updateStatus: jest.fn().mockResolvedValue(mockAlert),
      getEvents: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AlertsController],
      providers: [{ provide: AlertsService, useValue: mockService }],
    }).compile();

    controller = module.get<AlertsController>(AlertsController);
    service = module.get(AlertsService) as jest.Mocked<AlertsService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create alert for normal user with orgId', async () => {
      const dto: CreateAlertDto = { title: 'New Alert', description: 'Optional' };
      const result = await controller.create('org-123', 'normal', 'user-456', dto);

      expect(result).toEqual(mockAlert);
      expect(service.create).toHaveBeenCalledWith('org-123', 'user-456', dto);
    });

    it('should create alert for admin with dto.orgId', async () => {
      const dto: CreateAlertDto = { title: 'New Alert', orgId: 'org-999' };
      const result = await controller.create(null, 'admin', 'user-456', dto);

      expect(result).toEqual(mockAlert);
      expect(service.create).toHaveBeenCalledWith('org-999', 'user-456', dto);
    });

    it('should throw BadRequestException when orgId missing for normal user', async () => {
      const dto: CreateAlertDto = { title: 'New Alert' };

      await expect(controller.create(null, 'normal', 'user-456', dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.create(null, 'normal', 'user-456', dto)).rejects.toThrow(
        'Organization required to create alerts',
      );
      expect(service.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when admin has no orgId in dto', async () => {
      const dto: CreateAlertDto = { title: 'New Alert' };

      await expect(controller.create(null, 'admin', 'user-456', dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.create(null, 'admin', 'user-456', dto)).rejects.toThrow(
        'Organization required',
      );
      expect(service.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated alerts for org', async () => {
      const query: ListAlertsQueryDto = { limit: 10, offset: 0 };
      const result = await controller.findAll('org-123', 'normal', query);

      expect(result).toBeDefined();
      expect(service.findAll).toHaveBeenCalledWith('org-123', query);
    });

    it('should allow admin with null orgId', async () => {
      const query: ListAlertsQueryDto = {};
      await controller.findAll(null, 'admin', query);

      expect(service.findAll).toHaveBeenCalledWith(null, query);
    });

    it('should throw BadRequestException when normal user has no orgId', async () => {
      const query: ListAlertsQueryDto = {};

      await expect(controller.findAll(null, 'normal', query)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.findAll(null, 'normal', query)).rejects.toThrow(
        'Organization required to fetch alerts list',
      );
      expect(service.findAll).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return alert by id', async () => {
      const result = await controller.findOne('org-123', 'alert-123');

      expect(result).toEqual(mockAlert);
      expect(service.findOne).toHaveBeenCalledWith('org-123', 'alert-123');
    });
  });

  describe('updateStatus', () => {
    it('should update alert status', async () => {
      const dto: UpdateAlertStatusDto = { status: AlertStatus.ACKNOWLEDGED, version: 1 };
      const result = await controller.updateStatus('org-123', 'user-456', 'alert-123', dto);

      expect(result).toEqual(mockAlert);
      expect(service.updateStatus).toHaveBeenCalledWith('org-123', 'user-456', 'alert-123', dto);
    });
  });

  describe('getEvents', () => {
    it('should return events for alert', async () => {
      const mockEvents = [{ id: 'ev-1', toStatus: AlertStatus.NEW }];
      (service.getEvents as jest.Mock).mockResolvedValue(mockEvents);

      const result = await controller.getEvents('org-123', 'alert-123');

      expect(result).toEqual(mockEvents);
      expect(service.getEvents).toHaveBeenCalledWith('org-123', 'alert-123');
    });
  });
});
