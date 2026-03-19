import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';

@Injectable()
export class BeneficiariesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findScheduleByFiscalYear(_fiscalYearId: string) {
    throw new Error('Not implemented');
  }

  async findSlotById(_id: string) {
    throw new Error('Not implemented');
  }

  async findSlotsBySchedule(_scheduleId: string) {
    throw new Error('Not implemented');
  }

  async updateSlot(_id: string, _data: unknown) {
    throw new Error('Not implemented');
  }

  async createSchedule(_data: unknown) {
    throw new Error('Not implemented');
  }

  async createSlot(_data: unknown) {
    throw new Error('Not implemented');
  }
}
