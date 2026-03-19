import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';

@Injectable()
export class SessionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(_id: string) {
    throw new Error('Not implemented');
  }

  async findByFiscalYear(_fiscalYearId: string) {
    throw new Error('Not implemented');
  }

  async updateStatus(_id: string, _status: string) {
    throw new Error('Not implemented');
  }

  async createEntry(_data: unknown) {
    throw new Error('Not implemented');
  }

  async findEntries(_sessionId: string) {
    throw new Error('Not implemented');
  }

  async createTransactionSequence(_data: unknown) {
    throw new Error('Not implemented');
  }

  async getNextSequenceNumber(_sessionId: string): Promise<number> {
    throw new Error('Not implemented');
  }
}
