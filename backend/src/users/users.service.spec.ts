import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: jest.Mocked<PrismaService>;

  const mockOrg = {
    id: 'org-123',
    name: 'Acme Corp',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser = {
    id: 'user-456',
    email: 'user@example.com',
    name: 'Test User',
    orgId: 'org-123',
    createdAt: new Date(),
    org: { id: 'org-123', name: 'Acme Corp' },
  };

  beforeEach(async () => {
    const mockPrisma = {
      organization: {
        findUnique: jest.fn().mockResolvedValue(mockOrg),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([mockUser]),
        create: jest.fn().mockResolvedValue(mockUser),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create user when org exists and email is unique', async () => {
      const dto: CreateUserDto = {
        email: 'user@example.com',
        name: 'Test User',
        password: 'password123',
        orgId: 'org-123',
      };
      const result = await service.create(dto);

      expect(result).toEqual(mockUser);
      expect(prisma.organization.findUnique).toHaveBeenCalledWith({
        where: { id: dto.orgId },
      });
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: dto.email },
      });
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: dto.email,
          name: dto.name,
          password: dto.password,
          org: { connect: { id: dto.orgId } },
        },
        select: expect.any(Object),
      });
    });

    it('should throw NotFoundException when org does not exist', async () => {
      (prisma.organization.findUnique as jest.Mock).mockResolvedValue(null);
      const dto: CreateUserDto = {
        email: 'user@example.com',
        name: 'Test User',
        password: 'password123',
        orgId: 'org-999',
      };

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
      await expect(service.create(dto)).rejects.toThrow(
        'Organization org-999 not found',
      );
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when email already exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      const dto: CreateUserDto = {
        email: 'user@example.com',
        name: 'Test User',
        password: 'password123',
        orgId: 'org-123',
      };

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      await expect(service.create(dto)).rejects.toThrow(
        'User with email "user@example.com" already exists',
      );
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('findByOrg', () => {
    it('should return users for org when orgId provided', async () => {
      const result = await service.findByOrg('org-123');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        organization: { id: 'org-123', name: 'Acme Corp' },
      });
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { orgId: 'org-123' },
        select: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return all users when orgId is null', async () => {
      await service.findByOrg(null);

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {},
        select: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
    });
  });
});
