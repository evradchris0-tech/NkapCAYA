import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';

@Injectable()
export class CassationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(_data: unknown) {
    throw new Error('Not implemented');
  }

  async findById(_id: string) {
    throw new Error('Not implemented');
  }

  async findByFiscalYear(_fiscalYearId: string) {
    throw new Error('Not implemented');
  }

  async createRedistribution(_data: unknown) {
    throw new Error('Not implemented');
  }

  async findRedistributions(_cassationRecordId: string) {
    throw new Error('Not implemented');
  }

  async createPoolParticipantShare(_data: unknown) {
    throw new Error('Not implemented');
  }

  async updateStatus(_id: string, _status: string) {
    throw new Error('Not implemented');
  }
}
