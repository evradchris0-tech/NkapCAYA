import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { BeneficiariesRepository } from '../repositories/beneficiaries.repository';
import { AssignSlotDto } from '../dto/assign-slot.dto';

@Injectable()
export class BeneficiariesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly beneficiariesRepository: BeneficiariesRepository,
  ) {}

  async getSchedule(_fiscalYearId: string) {
    throw new Error('Not implemented');
  }

  async assignSlot(_slotId: string, _dto: AssignSlotDto) {
    throw new Error('Not implemented');
  }

  async markDelivered(_slotId: string) {
    throw new Error('Not implemented');
  }
}
