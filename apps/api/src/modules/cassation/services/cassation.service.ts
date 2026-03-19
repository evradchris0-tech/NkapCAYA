import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { CassationRepository } from '../repositories/cassation.repository';

@Injectable()
export class CassationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cassationRepository: CassationRepository,
  ) {}

  async executeCassation(_fiscalYearId: string) {
    throw new Error('Not implemented');
  }

  async generateRedistributions(_cassationRecordId: string) {
    throw new Error('Not implemented');
  }

  async findById(_id: string) {
    throw new Error('Not implemented');
  }
}
