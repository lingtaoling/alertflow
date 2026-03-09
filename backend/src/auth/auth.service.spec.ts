import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from './dto/login.dto';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: jest.Mocked<PrismaService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  const mockUserWithOrg = {
    id: 'user-123',
    email: 'user@example.com',
    password: 'password123',
    name: 'Test User',
    role: 'normal',
    orgId: 'org-456',
    createdAt: new Date(),
    updatedAt: new Date(),
    org: {
      id: 'org-456',
      name: 'Test Org',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  const mockAdminUser = {
    id: 'admin-123',
    email: 'admin@example.com',
    password: 'adminpass',
    name: 'Admin User',
    role: 'admin',
    orgId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    org: null,
  };

  beforeEach(async () => {
    const mockPrisma = {
      user: {
        findFirst: jest.fn().mockResolvedValue(mockUserWithOrg),
      },
    };

    const mockJwt = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
    };

    const mockConfig = {
      get: jest.fn((key: string) => {
        if (key === 'JWT_EXPIRES' || key === 'JWT_LIFETIME') return '1d';
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    jwtService = module.get(JwtService) as jest.Mocked<JwtService>;
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should return accessToken and user when credentials are valid', async () => {
      const dto: LoginDto = { email: 'user@example.com', password: 'password123' };
      const result = await service.login(dto);

      expect(result).toMatchObject({
        accessToken: 'mock-jwt-token',
        user: expect.objectContaining({
          id: mockUserWithOrg.id,
          email: mockUserWithOrg.email,
          name: mockUserWithOrg.name,
          role: mockUserWithOrg.role,
          organization: { id: 'org-456', name: 'Test Org' },
        }),
        org: expect.objectContaining({
          id: 'org-456',
          name: 'Test Org',
        }),
      });
      expect(result.user).not.toHaveProperty('password');
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { email: { equals: 'user@example.com', mode: 'insensitive' } },
        include: { org: true },
      });
      expect(jwtService.sign).toHaveBeenCalledWith(
        {
          sub: mockUserWithOrg.id,
          orgId: 'org-456',
          email: mockUserWithOrg.email,
          role: mockUserWithOrg.role,
        },
        expect.any(Object),
      );
    });

    it('should normalize email to lowercase', async () => {
      const dto: LoginDto = { email: 'USER@EXAMPLE.COM', password: 'password123' };
      await service.login(dto);

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { email: { equals: 'user@example.com', mode: 'insensitive' } },
        include: { org: true },
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
      const dto: LoginDto = { email: 'unknown@example.com', password: 'password123' };

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(dto)).rejects.toThrow('Invalid email or password');
    });

    it('should throw UnauthorizedException when password is wrong', async () => {
      const dto: LoginDto = { email: 'user@example.com', password: 'wrongpassword' };

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(dto)).rejects.toThrow('Invalid email or password');
    });

    it('should allow admin login when org is null', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockAdminUser);
      const dto: LoginDto = { email: 'admin@example.com', password: 'adminpass' };

      const result = await service.login(dto);

      expect(result).toMatchObject({
        accessToken: 'mock-jwt-token',
        user: expect.objectContaining({
          id: mockAdminUser.id,
          email: mockAdminUser.email,
          organization: null,
        }),
        org: null,
      });
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: mockAdminUser.id,
          orgId: null,
          role: 'admin',
        }),
        expect.any(Object),
      );
    });

    it('should throw UnauthorizedException when normal user has no org', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        ...mockUserWithOrg,
        orgId: null,
        org: null,
        role: 'normal',
      });
      const dto: LoginDto = { email: 'user@example.com', password: 'password123' };

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(dto)).rejects.toThrow('Invalid email or password');
    });
  });
});
