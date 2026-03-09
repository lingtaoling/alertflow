import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let service: jest.Mocked<AuthService>;

  const mockLoginResponse = {
    accessToken: 'mock-jwt-token',
    user: {
      id: 'user-123',
      email: 'user@example.com',
      name: 'Test User',
      role: 'normal',
      organization: { id: 'org-456', name: 'Test Org' },
    },
    org: { id: 'org-456', name: 'Test Org', createdAt: new Date() },
  };

  beforeEach(async () => {
    const mockService = {
      login: jest.fn().mockResolvedValue(mockLoginResponse),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get(AuthService) as jest.Mocked<AuthService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should return login response when credentials are valid', async () => {
      const dto: LoginDto = { email: 'user@example.com', password: 'password123' };
      const result = await controller.login(dto);

      expect(result).toEqual(mockLoginResponse);
      expect(service.login).toHaveBeenCalledWith(dto);
    });

    it('should delegate to AuthService with trimmed dto', async () => {
      const dto: LoginDto = { email: '  user@example.com  ', password: 'password123' };
      await controller.login(dto);

      expect(service.login).toHaveBeenCalledWith(dto);
    });
  });
});
