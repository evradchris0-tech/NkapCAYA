import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { BeneficiariesRepository } from '../repositories/beneficiaries.repository';
import { AssignSlotDto } from '../dto/assign-slot.dto';
import { BeneficiaryStatus } from '@prisma/client';

@Injectable()
export class BeneficiariesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly beneficiariesRepository: BeneficiariesRepository,
  ) {}

  async getSchedule(fiscalYearId: string) {
    const schedule = await this.beneficiariesRepository.findScheduleByFiscalYear(fiscalYearId);
    if (!schedule) {
      throw new NotFoundException(`Beneficiary schedule not found for fiscal year ${fiscalYearId}`);
    }
    return schedule;
  }

  /** Désigner un membre pour un slot UNASSIGNED → ASSIGNED */
  async assignSlot(slotId: string, dto: AssignSlotDto, actorId: string) {
    const slot = await this.beneficiariesRepository.findSlotById(slotId);
    if (!slot) throw new NotFoundException(`Slot ${slotId} not found`);

    if (slot.status !== BeneficiaryStatus.UNASSIGNED) {
      throw new ConflictException(`Slot is already ${slot.status}`);
    }

    // Vérifier unicité (sessionId, membershipId) — contrainte déjà en DB mais on renvoi un message clair
    const existing = await this.prisma.beneficiarySlot.findUnique({
      where: { sessionId_membershipId: { sessionId: slot.sessionId, membershipId: dto.membershipId } },
    });
    if (existing) {
      throw new ConflictException(
        `Membership ${dto.membershipId} is already assigned to a slot in session ${slot.sessionId}`,
      );
    }

    return this.beneficiariesRepository.updateSlot(slotId, {
      membership: { connect: { id: dto.membershipId } },
      designatedBy: { connect: { id: actorId } },
      designatedAt: new Date(),
      status: BeneficiaryStatus.ASSIGNED,
    });
  }

  /** Marquer un slot ASSIGNED → DELIVERED */
  async markDelivered(slotId: string, _actorId: string) {
    const slot = await this.beneficiariesRepository.findSlotById(slotId);
    if (!slot) throw new NotFoundException(`Slot ${slotId} not found`);

    if (slot.status !== BeneficiaryStatus.ASSIGNED) {
      throw new ConflictException(`Slot is ${slot.status}, expected ASSIGNED`);
    }

    return this.beneficiariesRepository.updateSlot(slotId, {
      status: BeneficiaryStatus.DELIVERED,
      deliveredAt: new Date(),
    });
  }
}
