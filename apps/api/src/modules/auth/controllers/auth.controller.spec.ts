import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from '../services/auth.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';

const mockAuthService = {
  login: jest.fn().mockResolvedValue({ accessToken: 'at', refreshToken: 'rt' }),
  refreshToken: jest.fn().mockResolvedValue({ accessToken: 'at2' }),
  logout: jest.fn().mockResolvedValue(undefined),
  getMe: jest.fn().mockResolvedValue({ id: 'u-1', username: 'test' }),
  changePassword: jest.fn().mockResolvedValue(undefined),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  it('should be defined', () => expect(controller).toBeDefined());

  it('A01 — login appelle authService.login(dto) et retourne les tokens', async () => {
    const dto = { username: 'user', password: 'pass' };
    mockAuthService.login.mockResolvedValue({ accessToken: 'at', refreshToken: 'rt' });
    const result = await controller.login(dto as any);
    expect(mockAuthService.login).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ accessToken: 'at', refreshToken: 'rt' });
  });

  it('A02 — refresh appelle authService.refreshToken(dto.refreshToken)', async () => {
    const dto = { refreshToken: 'rt-old' };
    await controller.refresh(dto);
    expect(mockAuthService.refreshToken).toHaveBeenCalledWith('rt-old');
  });

  it('A03 — logout appelle authService.logout(dto.refreshToken)', async () => {
    const dto = { refreshToken: 'rt-old' };
    await controller.logout(dto);
    expect(mockAuthService.logout).toHaveBeenCalledWith('rt-old');
  });

  it('A04 — me appelle authService.getMe(user.id)', async () => {
    const user = { id: 'u-1' };
    mockAuthService.getMe.mockResolvedValue({ id: 'u-1', username: 'test' });
    const result = await controller.me(user);
    expect(mockAuthService.getMe).toHaveBeenCalledWith('u-1');
    expect(result).toEqual({ id: 'u-1', username: 'test' });
  });
});
