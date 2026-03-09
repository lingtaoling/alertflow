import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { OrgsService } from './orgs.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrgDto } from './dto/create-org.dto';

describe('OrgsService', () => {
  let service: OrgsService;
  let prisma: jest.Mocked<PrismaService>;

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
    const mockPrisma = {
      organization: {
        findFirst: jest.fn().mockResolvedValue(null),
        findUnique: jest.fn().mockResolvedValue(mockOrgWithCounts),
        findMany: jest.fn().mockResolvedValue([mockOrgWithCounts]),
        create: jest.fn().mockResolvedValue(mockOrg),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrgsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<OrgsService>(OrgsService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create organization when name is unique', async () => {
      const dto: CreateOrgDto = { name: 'Acme Corp' };
      const result = await service.create(dto);

      expect(result).toEqual(mockOrg);
      expect(prisma.organization.findFirst).toHaveBeenCalledWith({
        where: { name: dto.name },
      });
      expect(prisma.organization.create).toHaveBeenCalledWith({
        data: { name: dto.name },
      });
    });

    it('should throw ConflictException when name already exists', async () => {
      (prisma.organization.findFirst as jest.Mock).mockResolvedValue(mockOrg);
      const dto: CreateOrgDto = { name: 'Acme Corp' };

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      await expect(service.create(dto)).rejects.toThrow(
        'Organization with name "Acme Corp" already exists',
      );
      expect(prisma.organization.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all organizations with counts', async () => {
      const result = await service.findAll();

      expect(result).toEqual([mockOrgWithCounts]);
      expect(prisma.organization.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          name: true,
          createdAt: true,
          _count: { select: { users: true, alerts: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return organization by id', async () => {
      const result = await service.findOne('org-123');

      expect(result).toEqual(mockOrgWithCounts);
      expect(prisma.organization.findUnique).toHaveBeenCalledWith({
        where: { id: 'org-123' },
        select: {
          id: true,
          name: true,
          createdAt: true,
          _count: { select: { users: true, alerts: true } },
        },
      });
    });
  });
});
