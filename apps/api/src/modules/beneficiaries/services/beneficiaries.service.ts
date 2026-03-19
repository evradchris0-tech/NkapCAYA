import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { BeneficiariesRepository } from '../repositories/beneficiaries.repository';
import { AssignSlotDto } from '../dto/assign-slot.dto';

@Injectable()
export class BeneficiariesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly beneficiariesRepository: BeneficiariesRepository,
  ) {}

  async getSchedule(fiscalYearId: string) {
    throw new Error('Not implemented');
  }

  async assignSlot(slotId: string, dto: AssignSlotDto) {
    throw new Error('Not implemented');
  }

  async markDelivered(slotId: string) {
    throw new Error('Not implemented');
  }
}
