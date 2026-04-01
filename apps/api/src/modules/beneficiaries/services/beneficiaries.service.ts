import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { BeneficiariesRepository } from '../repositories/beneficiaries.repository';
import { AssignSlotDto } from '../dto/assign-slot.dto';
import { MarkDeliveredDto } from '../dto/mark-delivered.dto';
import { BeneficiaryStatus, SessionStatus } from '@prisma/client';

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

    if (slot.status === BeneficiaryStatus.DELIVERED) {
      throw new ConflictException(`Slot is already ${slot.status} and cannot be reassigned`);
    }
    // Only UNASSIGNED and ASSIGNED are allowed for reassignment

    // Vérifier unicité (sessionId, membershipId) - exclure le slot actuel if already assigned
    const existing = await this.prisma.beneficiarySlot.findFirst({
      where: {
        sessionId: slot.sessionId,
        membershipId: dto.membershipId,
        NOT: { id: slotId },
      },
    });
    if (existing) {
      throw new ConflictException(
        `Membership ${dto.membershipId} is already assigned to another slot in session ${slot.sessionId}`,
      );
    }

    // Si isHost: true, retirer le flag des autres slots de la même session
    if (dto.isHost) {
      await this.beneficiariesRepository.clearHostForSession(slot.sessionId, slotId);
    }

    return this.beneficiariesRepository.updateSlot(slotId, {
      membership: { connect: { id: dto.membershipId } },
      designatedBy: { connect: { id: actorId } },
      designatedAt: new Date(),
      status: BeneficiaryStatus.ASSIGNED,
      isHost: dto.isHost ?? false,
    });
  }

  /** Marquer un slot ASSIGNED → DELIVERED (avec montant optionnel) */
  async markDelivered(slotId: string, _actorId: string, dto?: MarkDeliveredDto) {
    const slot = await this.beneficiariesRepository.findSlotById(slotId);
    if (!slot) throw new NotFoundException(`Slot ${slotId} not found`);

    if (slot.status !== BeneficiaryStatus.ASSIGNED) {
      throw new ConflictException(`Slot is ${slot.status}, expected ASSIGNED`);
    }

    const updateData: Parameters<typeof this.beneficiariesRepository.updateSlot>[1] = {
      status: BeneficiaryStatus.DELIVERED,
      deliveredAt: new Date(),
    };

    if (dto?.amount !== undefined && dto.amount > 0) {
      updateData.amountDelivered = dto.amount;
    }

    return this.beneficiariesRepository.updateSlot(slotId, updateData);
  }

  /** Définir l'hôte de la réunion pour un slot déjà ASSIGNED */
  async setHost(slotId: string) {
    const slot = await this.beneficiariesRepository.findSlotById(slotId);
    if (!slot) throw new NotFoundException(`Slot ${slotId} not found`);

    if (slot.status === BeneficiaryStatus.UNASSIGNED) {
      throw new BadRequestException('Cannot set host on an unassigned slot');
    }

    await this.beneficiariesRepository.clearHostForSession(slot.sessionId, slotId);
    return this.beneficiariesRepository.updateSlot(slotId, { isHost: true });
  }

  /** Ajouter un slot UNASSIGNED supplémentaire à une session */
  async addSlotToSession(sessionId: string, fiscalYearId: string) {
    // Vérifier que la session est OPEN
    const session = await this.prisma.monthlySession.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundException(`Session ${sessionId} not found`);
    if (session.status !== SessionStatus.OPEN) {
      throw new ConflictException('Cannot add beneficiary slot to a session that is not OPEN');
    }
    if (session.fiscalYearId !== fiscalYearId) {
      throw new BadRequestException('Session does not belong to this fiscal year');
    }

    // Récupérer le schedule de l'exercice
    const schedule = await this.beneficiariesRepository.findScheduleByFiscalYear(fiscalYearId);
    if (!schedule) {
      throw new NotFoundException(`Beneficiary schedule not found for fiscal year ${fiscalYearId}`);
    }

    // Calculer le prochain slotIndex
    const existingSlots = await this.beneficiariesRepository.findSlotsBySession(sessionId);
    const maxSlotIndex = existingSlots.reduce((max, s) => Math.max(max, s.slotIndex), 0);

    return this.beneficiariesRepository.createSlot({
      scheduleId: schedule.id,
      sessionId,
      month: session.sessionNumber,
      slotIndex: maxSlotIndex + 1,
      status: BeneficiaryStatus.UNASSIGNED,
    });
  }

  /** Supprimer un slot s'il n'est pas encore livré */
  async removeSlot(slotId: string) {
    const slot = await this.beneficiariesRepository.findSlotById(slotId);
    if (!slot) throw new NotFoundException(`Slot ${slotId} not found`);

    if (slot.status === BeneficiaryStatus.DELIVERED) {
      throw new ConflictException('Cannot remove a slot that is already DELIVERED');
    }

    return this.beneficiariesRepository.deleteSlot(slotId);
  }
}
