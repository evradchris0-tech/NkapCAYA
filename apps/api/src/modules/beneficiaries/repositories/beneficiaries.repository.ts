import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class BeneficiariesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findScheduleByFiscalYear(fiscalYearId: string) {
    throw new Error('Not implemented');
  }

  async findSlotById(id: string) {
    throw new Error('Not implemented');
  }

  async findSlotsBySchedule(scheduleId: string) {
    throw new Error('Not implemented');
  }

  async updateSlot(id: string, data: any) {
    throw new Error('Not implemented');
  }

  async createSchedule(data: any) {
    throw new Error('Not implemented');
  }

  async createSlot(data: any) {
    throw new Error('Not implemented');
  }
}
