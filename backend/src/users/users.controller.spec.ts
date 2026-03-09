import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let service: jest.Mocked<UsersService>;

  const mockUser = {
    id: 'user-456',
    email: 'user@example.com',
    name: 'Test User',
    orgId: 'org-123',
    createdAt: new Date(),
    organization: { id: 'org-123', name: 'Acme Corp' },
  };

  beforeEach(async () => {
    const mockService = {
      create: jest.fn().mockResolvedValue(mockUser),
      findByOrg: jest.fn().mockResolvedValue([mockUser]),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get(UsersService) as jest.Mocked<UsersService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create user and return it', async () => {
      const dto: CreateUserDto = {
        email: 'user@example.com',
        name: 'Test User',
        password: 'password123',
        orgId: 'org-123',
      };
      const result = await controller.create(dto);

      expect(result).toEqual(mockUser);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findByOrg', () => {
    it('should return users for org when orgId provided', async () => {
      const result = await controller.findByOrg('org-123');

      expect(result).toEqual([mockUser]);
      expect(service.findByOrg).toHaveBeenCalledWith('org-123');
    });

    it('should return all users when orgId is null (admin)', async () => {
      (service.findByOrg as jest.Mock).mockResolvedValue([mockUser, { ...mockUser, id: 'user-2' }]);
      const result = await controller.findByOrg(null);

      expect(result).toHaveLength(2);
      expect(service.findByOrg).toHaveBeenCalledWith(null);
    });
  });
});
