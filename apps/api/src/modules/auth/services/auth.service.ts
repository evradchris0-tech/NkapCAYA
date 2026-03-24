import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash, randomUUID } from 'crypto';
import { LoginDto } from '../dto/login.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { UserRepository } from '../repositories/user.repository';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';

export interface UserSafe {
  id: string;
  username: string;
  phone: string;
  role: string;
  isActive: boolean;
  lastLoginAt: Date | null;
}

export interface AuthResponse {
  tokens: { access: string; refresh: string };
  user: UserSafe;
}

export interface TokensResponse {
  tokens: { access: string; refresh: string };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly refreshTokenRepo: RefreshTokenRepository,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.userRepo.findByIdentifier(dto.identifier);

    if (!user) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Compte désactivé');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const tokens = await this.generateTokens(user);
    await this.userRepo.updateLastLogin(user.id);

    return {
      tokens,
      user: this.sanitizeUser(user),
    };
  }

  async refreshToken(rawToken: string): Promise<TokensResponse> {
    const tokenHash = this.hashToken(rawToken);
    const stored = await this.refreshTokenRepo.findValidByHash(tokenHash);

    if (!stored) {
      throw new UnauthorizedException('Token invalide ou expiré');
    }

    if (!stored.user.isActive) {
      throw new ForbiddenException('Compte désactivé');
    }

    // Rotation : révoquer l'ancien, créer un nouveau
    await this.refreshTokenRepo.revokeByHash(tokenHash);

    const accessToken = this.jwtService.sign({
      sub: stored.user.id,
      role: stored.user.role,
    });

    const newRawRefresh = randomUUID();
    const refreshExpiresIn = this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '30d');
    const expiresAt = this.calculateExpiry(refreshExpiresIn);

    await this.refreshTokenRepo.create({
      userId: stored.user.id,
      tokenHash: this.hashToken(newRawRefresh),
      expiresAt,
    });

    return {
      tokens: { access: accessToken, refresh: newRawRefresh },
    };
  }

  async logout(rawToken: string): Promise<void> {
    const tokenHash = this.hashToken(rawToken);
    await this.refreshTokenRepo.revokeByHash(tokenHash);
  }

  async getMe(userId: string): Promise<UserSafe> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable');
    }
    return this.sanitizeUser(user);
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable');
    }
    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Mot de passe actuel incorrect');
    }
    const newHash = await bcrypt.hash(dto.newPassword, 12);
    await this.userRepo.updatePassword(userId, newHash);
  }

  private async generateTokens(user: User): Promise<{ access: string; refresh: string }> {
    const accessToken = this.jwtService.sign({
      sub: user.id,
      role: user.role,
    });

    const rawRefresh = randomUUID();
    const refreshExpiresIn = this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '30d');
    const expiresAt = this.calculateExpiry(refreshExpiresIn);

    await this.refreshTokenRepo.create({
      userId: user.id,
      tokenHash: this.hashToken(rawRefresh),
      expiresAt,
    });

    return { access: accessToken, refresh: rawRefresh };
  }

  private sanitizeUser(user: User): UserSafe {
    return {
      id: user.id,
      username: user.username,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
    };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private calculateExpiry(duration: string): Date {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) {
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // fallback 30 days
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return new Date(Date.now() + value * multipliers[unit]);
  }
}
