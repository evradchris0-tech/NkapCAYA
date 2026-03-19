import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { SavingsRepository } from '../repositories/savings.repository';

@Injectable()
export class SavingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly savingsRepository: SavingsRepository,
  ) {}

  async getBalance(_membershipId: string) {
    throw new Error('Not implemented');
  }

  async distributeInterests(_sessionId: string) {
    throw new Error('Not implemented');
  }
}
