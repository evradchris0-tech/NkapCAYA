import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '@database/prisma.service';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByIdentifier(identifier: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        OR: [{ username: identifier }, { phone: identifier }],
      },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.user.count({ where: { id } });
    return count > 0;
  }
}
