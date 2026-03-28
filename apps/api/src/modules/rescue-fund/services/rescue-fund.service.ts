import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { RescueFundRepository } from '../repositories/rescue-fund.repository';
import { CreateRescueFundEventDto } from '../dto/create-rescue-fund-event.dto';
import Decimal from 'decimal.js';

@Injectable()
export class RescueFundService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rescueFundRepository: RescueFundRepository,
  ) {}

  async getLedger(fiscalYearId: string) {
    const ledger = await this.rescueFundRepository.findLedgerByFiscalYear(fiscalYearId);
    if (!ledger) {
      throw new NotFoundException(`Rescue fund ledger not found for fiscal year ${fiscalYearId}`);
    }
    return ledger;
  }

  async getEvents(fiscalYearId: string) {
    return this.rescueFundRepository.findEventsByFiscalYear(fiscalYearId);
  }

  /**
   * Enregistrer un décaissement de caisse de secours.
   * RES-02 : le montant est non négociable (récupéré depuis RescueEventAmount en DB).
   * RES-01 : après décaissement, totalBalance >= minimumPerMember × memberCount.
   */
  async recordEvent(
    fiscalYearId: string,
    dto: CreateRescueFundEventDto,
    actorId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const ledger = await tx.rescueFundLedger.findUnique({ where: { fiscalYearId } });
      if (!ledger) {
        throw new NotFoundException(`Rescue fund ledger not found for fiscal year ${fiscalYearId}`);
      }

      // RES-02 : montant fixé en DB
      const eventAmount = await this.rescueFundRepository.findRescueEventAmount(dto.eventType);
      if (!eventAmount) {
        throw new NotFoundException(`No configured amount for event type ${dto.eventType}`);
      }

      const configuredAmount = new Decimal(eventAmount.amount.toString());
      const currentBalance = new Decimal(ledger.totalBalance.toString());

      // RES-01 : vérifier que le solde post-décaissement reste >= minimumPerMember × memberCount
      const minimum = new Decimal(ledger.minimumPerMember.toString()).times(ledger.memberCount);
      const newBalance = currentBalance.minus(configuredAmount);
      if (newBalance.lessThan(minimum)) {
        throw new BadRequestException(
          `Solde insuffisant : après décaissement, le solde (${newBalance.toFixed(0)} XAF) serait inférieur au seuil minimum (${minimum.toFixed(0)} XAF).`,
        );
      }

      // Edge case : si la caisse est insuffisante, on donne tout ce qui reste
      const actualAmount = Decimal.min(configuredAmount, currentBalance);

      const event = await this.rescueFundRepository.createEvent(
        {
          ledgerId: ledger.id,
          beneficiaryId: dto.beneficiaryMembershipId,
          eventType: dto.eventType,
          amount: actualAmount.toFixed(2),
          authorizedById: actorId,
          eventDate: new Date(dto.eventDate),
          description: dto.description ?? null,
        },
        tx,
      );

      await this.rescueFundRepository.updateLedger(
        fiscalYearId,
        { totalBalance: newBalance.toFixed(2) },
        tx,
      );

      // Mettre à jour la position du membre bénéficiaire
      const position = await this.rescueFundRepository.findPositionByMembership(
        dto.beneficiaryMembershipId,
        tx,
      );
      if (position) {
        const newPositionBalance = new Decimal(position.balance.toString()).minus(actualAmount);
        const targetPerMember = new Decimal(ledger.targetPerMember.toString());
        const refillDebt = Decimal.max(
          new Decimal(0),
          targetPerMember.minus(newPositionBalance),
        );

        await this.rescueFundRepository.updatePosition(
          dto.beneficiaryMembershipId,
          {
            balance: newPositionBalance.toFixed(2),
            refillDebt: refillDebt.toFixed(2),
          },
          tx,
        );
      }

      return event;
    });
  }
}
