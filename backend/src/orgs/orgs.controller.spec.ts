import { Test, TestingModule } from '@nestjs/testing';
import { OrgsController } from './orgs.controller';
import { OrgsService } from './orgs.service';
import { CreateOrgDto } from './dto/create-org.dto';

describe('OrgsController', () => {
  let controller: OrgsController;
  let service: jest.Mocked<OrgsService>;

  const mockOrg = {
    id: 'org-123',
    name: 'Acme Corp',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOrgWithCounts = {
    ...mockOrg,
    _count: { users: 5, alerts: 10 },
  };

  beforeEach(async () => {
    const mockService = {
      create: jest.fn().mockResolvedValue(mockOrg),
      findAll: jest.fn().mockResolvedValue([mockOrgWithCounts]),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrgsController],
      providers: [{ provide: OrgsService, useValue: mockService }],
    }).compile();

    controller = module.get<OrgsController>(OrgsController);
    service = module.get(OrgsService) as jest.Mocked<OrgsService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create organization and return it', async () => {
      const dto: CreateOrgDto = { name: 'Acme Corp' };
      const result = await controller.create(dto);

      expect(result).toEqual(mockOrg);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return list of organizations', async () => {
      const result = await controller.findAll();

      expect(result).toEqual([mockOrgWithCounts]);
      expect(service.findAll).toHaveBeenCalled();
    });
  });
});
