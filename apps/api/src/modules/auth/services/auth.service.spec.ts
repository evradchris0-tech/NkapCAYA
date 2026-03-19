import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import { AuthService } from './auth.service';
import { UserRepository } from '../repositories/user.repository';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { User, RefreshToken } from '@prisma/client';

// ── Helpers ─────────────────────────────────────────────────

const hashToken = (token: string) =>
  createHash('sha256').update(token).digest('hex');

const mockUser = {
  id: 'u_test0001',
  username: 'tresorier01',
  phone: '237699000000',
  passwordHash: '$2b$12$hashedpassword',
  role: 'TRESORIER',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastLoginAt: null,
};

const mockInactiveUser = { ...mockUser, id: 'u_test0002', isActive: false };

// ── Test suite ──────────────────────────────────────────────

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: jest.Mocked<UserRepository>;
  let refreshTokenRepo: jest.Mocked<RefreshTokenRepository>;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserRepository,
          useValue: {
            findByIdentifier: jest.fn(),
            findById: jest.fn(),
            updateLastLogin: jest.fn(),
            exists: jest.fn(),
          },
        },
        {
          provide: RefreshTokenRepository,
          useValue: {
            create: jest.fn(),
            findValidByHash: jest.fn(),
            revokeByHash: jest.fn(),
            revokeAllForUser: jest.fn(),
            deleteExpired: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('fake.jwt.token'),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string, defaultValue?: string) => {
              const values: Record<string, string> = {
                JWT_SECRET: 'test-secret',
                JWT_REFRESH_SECRET: 'test-refresh-secret',
                JWT_REFRESH_EXPIRES_IN: '30d',
              };
              return values[key] ?? defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepo = module.get(UserRepository);
    refreshTokenRepo = module.get(RefreshTokenRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── T01 — Login avec username valide ────────────────────

  describe('T01 — login avec username valide', () => {
    it('should return tokens and user on valid username login', async () => {
      userRepo.findByIdentifier.mockResolvedValue(mockUser as unknown as User);
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);
      refreshTokenRepo.create.mockResolvedValue({} as unknown as RefreshToken);

      const result = await service.login({
        identifier: 'tresorier01',
        password: 'password123',
      });

      expect(result.tokens.access).toBe('fake.jwt.token');
      expect(result.tokens.refresh).toBeDefined();
      expect(result.user.id).toBe(mockUser.id);
      expect(result.user.username).toBe('tresorier01');
      expect(result.user.role).toBe('TRESORIER');
      expect((result.user as unknown as Record<string, unknown>).passwordHash).toBeUndefined();
      expect(userRepo.updateLastLogin).toHaveBeenCalledWith(mockUser.id);
    });
  });

  // ── T02 — Login avec phone valide ───────────────────────

  describe('T02 — login avec phone valide', () => {
    it('should return tokens and user on valid phone login', async () => {
      userRepo.findByIdentifier.mockResolvedValue(mockUser as unknown as User);
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);
      refreshTokenRepo.create.mockResolvedValue({} as unknown as RefreshToken);

      const result = await service.login({
        identifier: '237699000000',
        password: 'password123',
      });

      expect(result.tokens.access).toBeDefined();
      expect(result.user.phone).toBe('237699000000');
      expect(userRepo.findByIdentifier).toHaveBeenCalledWith('237699000000');
    });
  });

  // ── T03 — Login identifiant inconnu ─────────────────────

  describe('T03 — login avec identifiant inconnu', () => {
    it('should throw UnauthorizedException for unknown identifier', async () => {
      userRepo.findByIdentifier.mockResolvedValue(null);

      await expect(
        service.login({ identifier: 'inconnu', password: 'any' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ── T04 — Login mot de passe incorrect ──────────────────

  describe('T04 — login avec mot de passe incorrect', () => {
    it('should throw UnauthorizedException for wrong password', async () => {
      userRepo.findByIdentifier.mockResolvedValue(mockUser as unknown as User);
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => false);

      await expect(
        service.login({ identifier: 'tresorier01', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ── T05 — Login compte désactivé ────────────────────────

  describe('T05 — login sur compte désactivé', () => {
    it('should throw ForbiddenException for inactive account', async () => {
      userRepo.findByIdentifier.mockResolvedValue(mockInactiveUser as unknown as User);

      await expect(
        service.login({ identifier: 'tresorier01', password: 'any' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ── T06 — Refresh token valide ──────────────────────────

  describe('T06 — refresh avec token valide', () => {
    it('should return new tokens on valid refresh (rotation)', async () => {
      const rawToken = 'valid-refresh-uuid';
      refreshTokenRepo.findValidByHash.mockResolvedValue({
        id: 'rt-1',
        tokenHash: hashToken(rawToken),
        userId: mockUser.id,
        expiresAt: new Date(Date.now() + 86400000),
        revokedAt: null,
        createdAt: new Date(),
        userAgent: null,
        user: { id: mockUser.id, role: 'TRESORIER', isActive: true },
      } as unknown as RefreshToken & { user: { id: string; role: string; isActive: boolean } });
      refreshTokenRepo.revokeByHash.mockResolvedValue(undefined);
      refreshTokenRepo.create.mockResolvedValue({} as unknown as RefreshToken);

      const result = await service.refreshToken(rawToken);

      expect(result.tokens.access).toBe('fake.jwt.token');
      expect(result.tokens.refresh).toBeDefined();
      expect(result.tokens.refresh).not.toBe(rawToken); // rotation
      expect(refreshTokenRepo.revokeByHash).toHaveBeenCalledWith(hashToken(rawToken));
      expect(refreshTokenRepo.create).toHaveBeenCalled();
    });
  });

  // ── T07 — Refresh token expiré ──────────────────────────

  describe('T07 — refresh avec token expiré', () => {
    it('should throw UnauthorizedException for expired refresh token', async () => {
      refreshTokenRepo.findValidByHash.mockResolvedValue(null);

      await expect(
        service.refreshToken('expired-token'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ── T08 — Refresh token déjà révoqué ───────────────────

  describe('T08 — refresh avec token déjà révoqué', () => {
    it('should throw UnauthorizedException for revoked refresh token', async () => {
      refreshTokenRepo.findValidByHash.mockResolvedValue(null);

      await expect(
        service.refreshToken('revoked-token'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ── T09 — Logout révoque le token ──────────────────────

  describe('T09 — logout révoque le refresh token', () => {
    it('should revoke the refresh token on logout', async () => {
      const rawToken = 'token-to-revoke';
      refreshTokenRepo.revokeByHash.mockResolvedValue(undefined);

      await service.logout(rawToken);

      expect(refreshTokenRepo.revokeByHash).toHaveBeenCalledWith(hashToken(rawToken));
    });
  });

  // ── T10 — GET /me sans passwordHash ─────────────────────

  describe('T10 — getMe retourne profil sans passwordHash', () => {
    it('should return user profile without sensitive fields', async () => {
      userRepo.findById.mockResolvedValue(mockUser as unknown as User);

      const result = await service.getMe(mockUser.id);

      expect(result.id).toBe(mockUser.id);
      expect(result.username).toBe(mockUser.username);
      expect(result.phone).toBe(mockUser.phone);
      expect(result.role).toBe(mockUser.role);
      expect(result.isActive).toBe(true);
      expect((result as unknown as Record<string, unknown>).passwordHash).toBeUndefined();
    });

    it('should throw UnauthorizedException if user not found', async () => {
      userRepo.findById.mockResolvedValue(null);

      await expect(service.getMe('unknown')).rejects.toThrow(UnauthorizedException);
    });
  });
});
