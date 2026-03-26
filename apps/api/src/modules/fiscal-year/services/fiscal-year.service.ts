import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { FiscalYearRepository } from '../repositories/fiscal-year.repository';
import { ConfigService as TontineConfigService } from '../../config/services/config.service';
import { CreateFiscalYearDto } from '../dto/create-fiscal-year.dto';
import { AddMemberDto } from '../dto/add-member.dto';
import { FiscalYearStatus, EnrollmentType } from '@prisma/client';
import { Decimal } from 'decimal.js';
import * as dayjs from 'dayjs';
import { randomUUID } from 'crypto';

@Injectable()
export class FiscalYearService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fiscalYearRepository: FiscalYearRepository,
    private readonly configService: TontineConfigService,
  ) {}

  async create(dto: CreateFiscalYearDto, actorId: string) {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    const cassation = new Date(dto.cassationDate);
    const loanDue = new Date(dto.loanDueDate);

    // Contrainte : startDate < loanDueDate < cassationDate <= endDate
    if (!(start < loanDue && loanDue < cassation && cassation <= end)) {
      throw new BadRequestException(
        'Contrainte de dates non respectée : startDate < loanDueDate < cassationDate <= endDate',
      );
    }

    // Vérifier chevauchement avec un exercice PENDING ou ACTIVE
    const overlapping = await this.fiscalYearRepository.findOverlapping(start, end);
    if (overlapping) {
      throw new ConflictException(
        `Chevauchement avec l'exercice "${overlapping.label}" (${overlapping.status})`,
      );
    }

    return this.fiscalYearRepository.create({
      label: dto.label,
      startDate: start,
      endDate: end,
      cassationDate: cassation,
      loanDueDate: loanDue,
      notes: dto.notes,
      openedById: actorId,
    });
  }

  async findAll() {
    return this.fiscalYearRepository.findAll();
  }

  async findById(id: string) {
    const fy = await this.fiscalYearRepository.findById(id);
    if (!fy) throw new NotFoundException(`Exercice fiscal introuvable : ${id}`);
    return fy;
  }

  async activate(id: string, actorId: string) {
    const fy = await this.fiscalYearRepository.findById(id);
    if (!fy) throw new NotFoundException(`Exercice fiscal introuvable : ${id}`);
    if (fy.status !== FiscalYearStatus.PENDING) {
      throw new ConflictException(
        `L'exercice est déjà ${fy.status} — activation impossible`,
      );
    }

    // Vérifier qu'aucun autre exercice n'est ACTIVE
    const existing = await this.fiscalYearRepository.findActive();
    if (existing) {
      throw new ConflictException(`Un exercice ACTIVE existe déjà : ${existing.label}`);
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Figer la configuration (snapshot)
      await this.configService.snapshotForFiscalYear(id, actorId, tx);

      // 2. Créer les 12 sessions mensuelles (DRAFT) avec UUID pré-générés pour chainage
      const sessions = Array.from({ length: 12 }, (_, i) => ({
        id: randomUUID(),
        fiscalYearId: id,
        sessionNumber: i + 1,
        meetingDate: dayjs(fy.startDate).add(i, 'month').startOf('month').toDate(),
        status: 'DRAFT' as const,
      }));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await this.fiscalYearRepository.createMonthlySessions(sessions as any, tx);

      // 3. Créer le fond de secours
      const activeMemberships = await this.fiscalYearRepository.findActiveMemberships(id, tx);
      const ledger = await this.fiscalYearRepository.createRescueFundLedger(
        { fiscalYearId: id, memberCount: activeMemberships.length },
        tx,
      );

      // 4. Créer le planning des bénéficiaires et instancier les 12 slots vides
      const schedule = await this.fiscalYearRepository.createBeneficiarySchedule({ fiscalYearId: id }, tx);
      const slots = sessions.map((s, i) => ({
        id: randomUUID(),
        scheduleId: schedule.id,
        sessionId: s.id,
        month: s.sessionNumber,
        slotIndex: i + 1,
        status: 'UNASSIGNED' as const,
      }));
      await tx.beneficiarySlot.createMany({ data: slots });

      // 5. Créer un SavingsLedger et RescueFundPosition par membre actif
      for (const membership of activeMemberships) {
        await this.fiscalYearRepository.createSavingsLedger({ membershipId: membership.id }, tx);
        await this.fiscalYearRepository.createRescueFundPosition(
          { membershipId: membership.id, ledgerId: ledger.id },
          tx,
        );
      }

      // 6. Activer l'exercice
      return this.fiscalYearRepository.updateStatus(
        id,
        FiscalYearStatus.ACTIVE,
        { openedAt: new Date(), openedById: actorId },
        tx,
      );
    });
  }

  async openCassation(id: string, _actorId: string) {
    const fy = await this.fiscalYearRepository.findById(id);
    if (!fy) throw new NotFoundException(`Exercice fiscal introuvable : ${id}`);
    if (fy.status !== FiscalYearStatus.ACTIVE) {
      throw new ConflictException(
        `L'exercice doit être ACTIVE pour ouvrir la cassation (actuel : ${fy.status})`,
      );
    }
    return this.fiscalYearRepository.updateStatus(id, FiscalYearStatus.CASSATION);
  }

  async addMember(fiscalYearId: string, dto: AddMemberDto, _actorId: string) {
    const fy = await this.fiscalYearRepository.findById(fiscalYearId);
    if (!fy) throw new NotFoundException(`Exercice fiscal introuvable : ${fiscalYearId}`);

    if (
      fy.status === FiscalYearStatus.CASSATION ||
      fy.status === FiscalYearStatus.CLOSED ||
      fy.status === FiscalYearStatus.ARCHIVED
    ) {
      throw new ForbiddenException(
        `Impossible d'inscrire un membre en status ${fy.status}`,
      );
    }

    // Vérifier que le membre n'est pas déjà inscrit
    const existing = await this.fiscalYearRepository.findMembership(fiscalYearId, dto.profileId);
    if (existing) {
      throw new ConflictException(`Ce membre est déjà inscrit à l'exercice ${fy.label}`);
    }

    // Déterminer le shareUnitAmount selon le status
    let shareUnitAmount: Decimal;
    if (fy.status === FiscalYearStatus.ACTIVE) {
      if (!fy.config) {
        throw new ConflictException('Snapshot de configuration introuvable pour cet exercice');
      }
      shareUnitAmount = new Decimal(fy.config.shareUnitAmount.toString());
    } else {
      const config = await this.configService.findConfig();
      shareUnitAmount = new Decimal(config.shareUnitAmount.toString());
    }

    const sharesCount = new Decimal(dto.sharesCount.toString());
    const monthlyAmount = sharesCount.mul(shareUnitAmount);

    // Calcul du rattrapage pour les inscriptions en cours d'exercice
    const catchUpAmount =
      dto.enrollmentType === EnrollmentType.MID_YEAR
        ? new Decimal(dto.joinedAtMonth - 1).mul(monthlyAmount)
        : new Decimal(0);

    return this.prisma.$transaction(async (tx) => {
      const membership = await this.fiscalYearRepository.createMembership(
        {
          fiscalYearId,
          profileId: dto.profileId,
          enrollmentType: dto.enrollmentType,
          joinedAt: new Date(dto.joinedAt),
          joinedAtMonth: dto.joinedAtMonth,
          catchUpAmount,
        },
        tx,
      );

      await this.fiscalYearRepository.createShareCommitment(
        {
          membershipId: membership.id,
          sharesCount: dto.sharesCount,
          monthlyAmount,
        },
        tx,
      );

      // Si l'exercice est déjà ACTIVE, créer les enregistrements financiers immédiatement
      if (fy.status === FiscalYearStatus.ACTIVE) {
        await this.fiscalYearRepository.createSavingsLedger({ membershipId: membership.id }, tx);

        const ledger = await this.fiscalYearRepository.findRescueFundLedger(fiscalYearId);
        if (ledger) {
          await this.fiscalYearRepository.createRescueFundPosition(
            { membershipId: membership.id, ledgerId: ledger.id },
            tx,
          );
          await this.fiscalYearRepository.updateRescueFundLedger(
            ledger.id,
            { memberCount: { increment: 1 } },
            tx,
          );
        }
      }

      return membership;
    });
  }

  async getMemberships(fiscalYearId: string) {
    const fy = await this.fiscalYearRepository.findById(fiscalYearId);
    if (!fy) throw new NotFoundException(`Exercice fiscal introuvable : ${fiscalYearId}`);
    return this.fiscalYearRepository.findMemberships(fiscalYearId);
  }

  async getSessions(fiscalYearId: string) {
    const fy = await this.fiscalYearRepository.findById(fiscalYearId);
    if (!fy) throw new NotFoundException(`Exercice fiscal introuvable : ${fiscalYearId}`);
    return this.prisma.monthlySession.findMany({
      where: { fiscalYearId },
      orderBy: { sessionNumber: 'asc' },
    });
  }
}
