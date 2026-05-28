import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';

@Injectable()
export class ReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getFullFiscalYearData(fiscalYearId: string) {
    const [fiscalYear, memberships, sessions, savingsLedgers, loans, poolParticipants] =
      await Promise.all([
        this.prisma.fiscalYear.findUniqueOrThrow({
          where: { id: fiscalYearId },
          include: { config: true },
        }),
        this.prisma.membership.findMany({
          where: { fiscalYearId, deletedAt: null },
          include: { profile: true, shareCommitment: true },
          orderBy: { profile: { lastName: 'asc' } },
        }),
        this.prisma.monthlySession.findMany({
          where: { fiscalYearId },
          include: {
            entries: {
              where: { deletedAt: null },
              include: { membership: { include: { profile: true } } },
            },
            interestDistribution: { include: { allocations: true } },
          },
          orderBy: { sessionNumber: 'asc' },
        }),
        this.prisma.savingsLedger.findMany({
          where: { membership: { fiscalYearId, deletedAt: null } },
          include: {
            entries: { where: { deletedAt: null }, orderBy: { createdAt: 'asc' } },
            membership: { include: { profile: true } },
          },
        }),
        this.prisma.loanAccount.findMany({
          where: { fiscalYearId },
          include: {
            monthlyAccruals: { orderBy: { month: 'asc' } },
            repayments: { where: { deletedAt: null }, orderBy: { recordedAt: 'asc' } },
            membership: { include: { profile: true } },
          },
        }),
        this.prisma.poolParticipant.findMany({
          where: { fiscalYearId, deletedAt: null },
        }),
      ]);

    return { fiscalYear, memberships, sessions, savingsLedgers, loans, poolParticipants };
  }

  /**
   * Données complètes pour le rapport individuel d'un membre.
   * Si fiscalYearId est fourni, filtre sur cet exercice.
   * Sinon, retourne les données de l'exercice actif ou le plus récent.
   */
  async getMemberReportData(memberId: string, fiscalYearId?: string) {
    // Résoudre le membership
    const membershipWhere = fiscalYearId
      ? { profileId: memberId, fiscalYearId, deletedAt: null }
      : { profileId: memberId, deletedAt: null };

    // Récupérer le profil
    const profile = await this.prisma.memberProfile.findUnique({
      where: { id: memberId },
      include: { user: true },
    });
    if (!profile) {
      throw new NotFoundException(`Membre ${memberId} introuvable.`);
    }

    // Tous les memberships du membre
    const allMemberships = await this.prisma.membership.findMany({
      where: membershipWhere,
      include: {
        fiscalYear: true,
        shareCommitment: true,
      },
      orderBy: { joinedAt: 'desc' },
    });

    if (allMemberships.length === 0) {
      return {
        profile,
        memberships: [],
        savings: null,
        loans: [],
        rescueFundPositions: [],
        beneficiarySlots: [],
      };
    }

    // Utiliser le premier membership (le plus récent ou celui de l'exercice demandé)
    const primaryMembership = allMemberships[0];
    const membershipIds = allMemberships.map((m) => m.id);

    const [savings, loans, rescueFundPositions, beneficiarySlots] = await Promise.all([
      // Épargne du membership primaire
      this.prisma.savingsLedger.findFirst({
        where: { membershipId: primaryMembership.id },
        include: {
          entries: {
            where: { deletedAt: null },
            orderBy: { createdAt: 'asc' },
          },
        },
      }),

      // Prêts sur tous les memberships
      this.prisma.loanAccount.findMany({
        where: { membershipId: { in: membershipIds } },
        include: {
          monthlyAccruals: { orderBy: { month: 'asc' } },
          repayments: {
            where: { deletedAt: null },
            orderBy: { recordedAt: 'asc' },
          },
          membership: { include: { fiscalYear: true } },
        },
        orderBy: { requestedAt: 'desc' },
      }),

      // Positions caisse de secours
      this.prisma.rescueFundPosition.findMany({
        where: { membershipId: { in: membershipIds }, deletedAt: null },
        include: {
          ledger: { include: { fiscalYear: true } },
        },
      }),

      // Slots bénéficiaires
      this.prisma.beneficiarySlot.findMany({
        where: { membershipId: { in: membershipIds } },
        include: {
          session: true,
        },
        orderBy: { month: 'asc' },
      }),
    ]);

    return {
      profile,
      memberships: allMemberships,
      savings,
      loans,
      rescueFundPositions,
      beneficiarySlots,
    };
  }

  /**
   * Données complètes pour le rapport d'une session mensuelle.
   * Inclut entrées, totaux, bénéficiaires et membres absents.
   */
  async getSessionReportData(sessionId: string) {
    const session = await this.prisma.monthlySession.findUnique({
      where: { id: sessionId },
      include: {
        fiscalYear: { include: { config: true } },
        entries: {
          where: { deletedAt: null },
          include: { membership: { include: { profile: true } } },
          orderBy: { recordedAt: 'asc' },
        },
        interestDistribution: {
          include: { allocations: { include: { membership: { include: { profile: true } } } } },
        },
      },
    });

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} introuvable.`);
    }

    // Tous les membres inscrits à l'exercice
    const allMemberships = await this.prisma.membership.findMany({
      where: { fiscalYearId: session.fiscalYearId, deletedAt: null },
      include: { profile: true },
      orderBy: { profile: { lastName: 'asc' } },
    });

    // Membres ayant payé leur cotisation
    const cotisantIds = new Set(
      session.entries
        .filter((e) => e.type === 'COTISATION')
        .map((e) => e.membershipId),
    );

    // Membres absents (sans cotisation)
    const absentMembers = allMemberships.filter((m) => !cotisantIds.has(m.id));

    // Slots bénéficiaires de cette session
    const beneficiarySlots = await this.prisma.beneficiarySlot.findMany({
      where: { sessionId },
      include: { membership: { include: { profile: true } } },
    });

    // Calcul des totaux par type de transaction
    const totauxParType: Record<string, number> = {};
    for (const entry of session.entries) {
      totauxParType[entry.type] = (totauxParType[entry.type] ?? 0) + Number(entry.amount);
    }

    const totalGeneral = Object.values(totauxParType).reduce((s, v) => s + v, 0);
    const tauxCotisation =
      allMemberships.length > 0
        ? Math.round((cotisantIds.size / allMemberships.length) * 100)
        : 0;

    return {
      session,
      allMemberships,
      absentMembers,
      beneficiarySlots,
      totauxParType,
      totalGeneral,
      tauxCotisation,
      cotisantCount: cotisantIds.size,
    };
  }
}

