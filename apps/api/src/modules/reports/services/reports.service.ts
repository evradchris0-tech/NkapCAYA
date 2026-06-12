import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Prisma } from '@prisma/client';
import { ReportsRepository } from '../repositories/reports.repository';
import { ImportFiscalYearDto } from '../dto/import-fiscal-year.dto';
import {
  classifySpecialAccount,
  reconstructLoanTimeline,
  computeLastRecordedMonth,
  sessionStatusForOngoing,
  SPECIAL_POOL_LABELS,
  type SpecialAccountKind,
} from './import.helpers';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

/* ── helpers ── */

function norm(name: string): string {
  return name
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function monthDate(start: Date, monthOffset: number): Date {
  const d = new Date(start);
  d.setMonth(d.getMonth() + monthOffset);
  d.setDate(1);
  return d;
}

function makeRef(fyLabel: string, month: number, type: string, seq: number): string {
  const mm = String(month).padStart(2, '0');
  const s = String(seq).padStart(4, '0');
  return `CAYA-${fyLabel}-${mm}-${type}-${s}`;
}

@Injectable()
export class ReportsService {
  constructor(
    private readonly reportsRepository: ReportsRepository,
    private readonly prisma: PrismaService,
  ) {}

  /* ──────────────────────────────── READ ──────────────────────────────── */

  async generateAnnualSummary(fiscalYearId: string, _format?: string) {
    return this.reportsRepository.getFullFiscalYearData(fiscalYearId);
  }

  /**
   * Rapport individuel d'un membre.
   * Retourne épargne, prêts, caisse de secours, slots bénéficiaires
   * et l'historique de tous ses memberships.
   *
   * @param memberId      ID du profil membre (MemberProfile.id)
   * @param fiscalYearId  Exercice cible (optionnel — par défaut : le plus récent)
   */
  async generateMemberReport(memberId: string, fiscalYearId?: string, _format?: string) {
    return this.reportsRepository.getMemberReportData(memberId, fiscalYearId);
  }

  /**
   * Rapport complet d'une session mensuelle.
   * Retourne les transactions, les totaux par type, les membres absents,
   * les bénéficiaires et le taux de cotisation.
   *
   * @param sessionId  ID de la session mensuelle (MonthlySession.id)
   */
  async generateSessionReport(sessionId: string, _format?: string) {
    return this.reportsRepository.getSessionReportData(sessionId);
  }

  /* ──────────────────────────────── IMPORT ──────────────────────────────── */

  async importFiscalYear(dto: ImportFiscalYearDto, actorId: string) {
    // Check label uniqueness
    const existing = await this.prisma.fiscalYear.findUnique({ where: { label: dto.label } });
    if (existing) throw new BadRequestException(`Un exercice avec le label "${dto.label}" existe déjà.`);

    // Garde-fou : ne jamais importer les postes comptables spéciaux comme membres
    // (SECOURS / CAYA, BUREAU, AUTRES / FETE). Le parseur les exclut déjà ;
    // on re-filtre ici au cas où un client enverrait une charge utile ancienne.
    const memberNames = dto.members.filter((nm) => !classifySpecialAccount(nm));

    // Montants des comptes spéciaux (feuille ep+int), regroupés par type de pool.
    const specialAmounts: Record<SpecialAccountKind, number> = {
      RESCUE_FUND: 0,
      BUREAU: 0,
      AUTRES_FETE: 0,
    };
    for (const sa of dto.specialAccounts ?? []) {
      specialAmounts[sa.kind] = (specialAmounts[sa.kind] ?? 0) + num(sa.totalDeposit);
    }

    // Mode d'import : archivé (CLÔTURÉ) par défaut, ou "en cours" (ACTIF) si demandé.
    const keepOpen = dto.keepOpen === true;
    if (keepOpen) {
      const activeFy = await this.prisma.fiscalYear.findFirst({
        where: { status: 'ACTIVE', deletedAt: null },
      });
      if (activeFy) {
        throw new BadRequestException(
          `Import "en cours" impossible : l'exercice "${activeFy.label}" est déjà ACTIF. Clôturez-le d'abord.`,
        );
      }
    }
    // Dernier mois réellement saisi → détermine où reprendre la saisie (mode "en cours").
    const lastRecorded = computeLastRecordedMonth(dto);

    // Read current tontine config (for snapshot)
    const tontineConfig = await this.prisma.tontineConfig.findUnique({ where: { id: 'caya' } });
    if (!tontineConfig) throw new BadRequestException('Configuration tontine introuvable.');

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    const now = new Date();

    // ── Step 1: Resolve members (read-only) ──
    const allProfiles = await this.prisma.memberProfile.findMany({
      where: { deletedAt: null },
      include: { user: { select: { id: true } } },
    });

    const profileByNorm = new Map<string, { profileId: string; userId: string }>();
    for (const p of allProfiles) {
      const key1 = norm(`${p.lastName} ${p.firstName}`);
      const key2 = norm(`${p.firstName} ${p.lastName}`);
      const val = { profileId: p.id, userId: p.user.id };
      profileByNorm.set(key1, val);
      if (key1 !== key2) profileByNorm.set(key2, val);
    }

    const membersToCreate: string[] = [];
    const resolvedMembers = new Map<string, { profileId: string; userId: string }>();

    for (const name of memberNames) {
      const key = norm(name);
      const found = profileByNorm.get(key);
      if (found) {
        resolvedMembers.set(key, found);
      } else {
        membersToCreate.push(name);
      }
    }

    // ── Step 2: Big transaction ──
    const result = await this.prisma.$transaction(
      async (tx) => {
        // 2a. Create missing members
        let seqCounter = 0;
        const usersData: Prisma.UserCreateManyInput[] = [];
        const profilesData: Prisma.MemberProfileCreateManyInput[] = [];

        for (const name of membersToCreate) {
          seqCounter++;
          const parts = name.trim().split(/\s+/);
          const lastName = parts[0] || 'INCONNU';
          const firstName = parts.slice(1).join(' ') || 'IMPORT';

          // 1. Recherche des infos dans le DTO `membersInfo`
          const normName = norm(name);
          const info = dto.membersInfo?.find(m => norm(m.originalName) === normName);

          if (!info || !info.phone) {
            throw new BadRequestException(`Impossible d'importer: Le numéro de téléphone est manquant pour le membre "${name}". Veuillez le renseigner dans la feuille 'membres_infos' du modèle.`);
          }

          const phone = info.phone;
          const neighborhood = info.neighborhood || 'Non défini';
          
          const passwordHash = await bcrypt.hash(`Caya2026!`, 10);
          const memberCode = `IMP${Date.now().toString().slice(-6)}${seqCounter}`;

          const userId = randomUUID();
          const profileId = randomUUID();

          usersData.push({
            id: userId,
            username: phone,
            phone,
            passwordHash,
            role: 'MEMBRE',
            isActive: true,
          });

          profilesData.push({
            id: profileId,
            userId,
            memberCode,
            firstName,
            lastName,
            phone1: phone,
            neighborhood,
          });

          const key = norm(name);
          resolvedMembers.set(key, { profileId, userId });
        }

        if (usersData.length > 0) {
          await tx.user.createMany({ data: usersData });
          await tx.memberProfile.createMany({ data: profilesData });
        }

        // 2b. Create FiscalYear
        const fyId = randomUUID();
        const cassationDate = new Date(endDate);
        const loanDueDate = new Date(endDate);
        loanDueDate.setMonth(loanDueDate.getMonth() - 1);

        await tx.fiscalYear.create({
          data: {
            id: fyId,
            label: dto.label,
            startDate,
            endDate,
            cassationDate,
            loanDueDate,
            status: keepOpen ? 'ACTIVE' : 'CLOSED',
            isImported: true,
            openedAt: now,
            openedById: actorId,
            closedAt: keepOpen ? null : now,
            closedById: keepOpen ? null : actorId,
          },
        });

        // 2c. Create FiscalYearConfig (snapshot of current config)
        await tx.fiscalYearConfig.create({
          data: {
            id: randomUUID(),
            fiscalYearId: fyId,
            snapshotById: actorId,
            shareUnitAmount: tontineConfig.shareUnitAmount,
            loanMonthlyRate: tontineConfig.loanMonthlyRate,
            maxLoanMultiplier: tontineConfig.maxLoanMultiplier,
            minSavingsToLoan: tontineConfig.minSavingsToLoan,
            maxConcurrentLoans: tontineConfig.maxConcurrentLoans,
            rescueFundTarget: tontineConfig.rescueFundTarget,
            rescueFundMinBalance: tontineConfig.rescueFundMinBalance,
            registrationFeeNew: tontineConfig.registrationFeeNew,
            registrationFeeReturning: tontineConfig.registrationFeeReturning,
          },
        });

        // 2d. Create 12 MonthlySession
        // Archive : toutes CLOSED. "En cours" : mois ≤ dernier saisi CLOSED,
        // le mois suivant OPEN (reprise de la saisie), le reste DRAFT.
        const sessionMap = new Map<number, string>(); // sessionNumber → sessionId
        const sessionsData: Prisma.MonthlySessionCreateManyInput[] = [];
        for (let m = 1; m <= 12; m++) {
          const sessionId = randomUUID();
          const meetingDate = monthDate(startDate, m - 1);
          const sessStatus = keepOpen ? sessionStatusForOngoing(m, lastRecorded) : 'CLOSED';
          const isClosed = sessStatus === 'CLOSED';
          const isDraft = sessStatus === 'DRAFT';
          
          sessionsData.push({
            id: sessionId,
            fiscalYearId: fyId,
            sessionNumber: m,
            meetingDate,
            status: sessStatus,
            openedAt: isDraft ? null : now,
            openedById: isDraft ? null : actorId,
            closedAt: isClosed ? now : null,
            closedById: isClosed ? actorId : null,
          });
          sessionMap.set(m, sessionId);
        }
        await tx.monthlySession.createMany({ data: sessionsData });

        // 2e. Create Memberships + ShareCommitments
        const shareUnit = Number(tontineConfig.shareUnitAmount);
        const membershipMap = new Map<string, string>(); // normName → membershipId

        const membershipsData: Prisma.MembershipCreateManyInput[] = [];
        const shareCommitmentsData: Prisma.ShareCommitmentCreateManyInput[] = [];

        for (const name of memberNames) {
          const key = norm(name);
          const resolved = resolvedMembers.get(key);
          if (!resolved) continue;

          const membershipId = randomUUID();

          // Deduce shares from most common monthly savings deposit
          const savRow = dto.savings.find((s) => norm(s.memberName) === key);
          let sharesCount = 1;
          if (savRow) {
            const vals = Object.values(savRow.deposits).filter((v) => v > 0);
            if (vals.length > 0) {
              // Most frequent deposit
              const freq = new Map<number, number>();
              for (const v of vals) freq.set(v, (freq.get(v) || 0) + 1);
              let maxFreq = 0;
              let typicalDeposit = vals[0];
              for (const [v, c] of freq) {
                if (c > maxFreq) { maxFreq = c; typicalDeposit = v; }
              }
              sharesCount = Math.max(1, Math.round(typicalDeposit / shareUnit));
            }
          }

          membershipsData.push({
            id: membershipId,
            profileId: resolved.profileId,
            fiscalYearId: fyId,
            status: 'ACTIVE',
            joinedAt: startDate,
            joinedAtMonth: 1,
            enrollmentType: 'NEW',
            registrationFeePaid: true,
            rescueContribPaid: true,
            initialSavingsPaid: true,
          });

          shareCommitmentsData.push({
            id: randomUUID(),
            membershipId,
            sharesCount,
            monthlyAmount: sharesCount * shareUnit,
            isLocked: true,
            lockedAt: now,
            lockedById: actorId,
          });

          membershipMap.set(key, membershipId);
        }

        if (membershipsData.length > 0) {
          await tx.membership.createMany({ data: membershipsData });
          await tx.shareCommitment.createMany({ data: shareCommitmentsData });
        }

        // Helper: get membershipId by name
        const getMsId = (name: string): string | undefined => membershipMap.get(norm(name));

        // 2f. Create SavingsLedger + SavingsEntry per member
        const savingsLedgersData: Prisma.SavingsLedgerCreateManyInput[] = [];
        const savingsEntriesData: Prisma.SavingsEntryCreateManyInput[] = [];
        
        for (const sav of dto.savings) {
          const msId = getMsId(sav.memberName);
          if (!msId) continue;

          const ledgerId = randomUUID();
          const totalDep = num(sav.totalDeposit);
          const totalInt = num(sav.totalInterest);

          savingsLedgersData.push({
            id: ledgerId,
            membershipId: msId,
            balance: totalDep + totalInt,
            principalBalance: totalDep,
            totalInterestReceived: totalInt,
          });

          // Deposit entries — triées par mois pour garantir la cohérence de balanceAfter
          let runningBalance = 0;
          const sortedDeposits = Object.entries(sav.deposits)
            .sort(([a], [b]) => Number(a) - Number(b));
          for (const [monthStr, amount] of sortedDeposits) {
            const m = Number(monthStr);
            const amt = num(amount);
            if (amt <= 0) continue;
            runningBalance += amt;
            savingsEntriesData.push({
              id: randomUUID(),
              ledgerId,
              sessionId: sessionMap.get(m) as string,
              month: m,
              amount: amt,
              type: 'DEPOSIT',
              balanceAfter: runningBalance,
            });
          }

          // Interest entries — triées par mois
          const sortedInterests = Object.entries(sav.interests)
            .sort(([a], [b]) => Number(a) - Number(b));
          for (const [monthStr, amount] of sortedInterests) {
            const m = Number(monthStr);
            const amt = num(amount);
            if (amt <= 0) continue;
            runningBalance += amt;
            savingsEntriesData.push({
              id: randomUUID(),
              ledgerId,
              sessionId: sessionMap.get(m) as string,
              month: m,
              amount: amt,
              type: 'INTEREST_CREDIT',
              balanceAfter: runningBalance,
            });
          }
        }

        if (savingsLedgersData.length > 0) {
          await tx.savingsLedger.createMany({ data: savingsLedgersData });
          await tx.savingsEntry.createMany({ data: savingsEntriesData });
        }

        // 2g. Create RescueFundLedger + Positions
        const rescueData = dto.rescueFund;
        const memberCount = memberNames.length;
        let rescueTotalBalance = 0;

        const rescueLedgerId = randomUUID();
        await tx.rescueFundLedger.create({
          data: {
            id: rescueLedgerId,
            fiscalYearId: fyId,
            totalBalance: 0, // will update after
            targetPerMember: tontineConfig.rescueFundTarget,
            minimumPerMember: tontineConfig.rescueFundMinBalance,
            memberCount,
            targetTotal: Number(tontineConfig.rescueFundTarget) * memberCount,
          },
        });

        const rescuePositionsData: Prisma.RescueFundPositionCreateManyInput[] = [];

        for (const rf of rescueData) {
          const msId = getMsId(rf.memberName);
          if (!msId) continue;

          const totalContrib = Object.values(rf.contributions).reduce((s, v) => s + num(v), 0);
          const paidAmount = num(rf.inscription) + totalContrib;
          rescueTotalBalance += paidAmount;

          rescuePositionsData.push({
            id: randomUUID(),
            membershipId: msId,
            ledgerId: rescueLedgerId,
            paidAmount,
            balance: paidAmount,
          });
        }
        
        if (rescuePositionsData.length > 0) {
          await tx.rescueFundPosition.createMany({ data: rescuePositionsData });
        }

        // Update ledger total
        await tx.rescueFundLedger.update({
          where: { id: rescueLedgerId },
          data: { totalBalance: rescueTotalBalance },
        });

        // 2h. Create SessionEntry per session per member
        const refSeq: Record<string, number> = {};
        const nextSeq = (type: string, month: number): number => {
          const k = `${type}-${month}`;
          refSeq[k] = (refSeq[k] || 0) + 1;
          return refSeq[k];
        };

        // Session totals accumulators
        const sessionTotals = new Map<
          string,
          {
            totalInscription: number;
            totalSecours: number;
            totalCotisation: number;
            totalPot: number;
            totalRbtPrincipal: number;
            totalRbtInterest: number;
            totalEpargne: number;
            totalProjet: number;
            totalAutres: number;
          }
        >();
        for (const [, sId] of sessionMap) {
          sessionTotals.set(sId, {
            totalInscription: 0, totalSecours: 0, totalCotisation: 0,
            totalPot: 0, totalRbtPrincipal: 0, totalRbtInterest: 0,
            totalEpargne: 0, totalProjet: 0, totalAutres: 0,
          });
        }

        const sessionEntriesData: Prisma.SessionEntryCreateManyInput[] = [];

        for (const sess of dto.sessions) {
          const sessionId = sessionMap.get(sess.sessionNumber);
          if (!sessionId) continue;
          const totals = sessionTotals.get(sessionId)!;
          const fyLbl = dto.label.replace(/-/g, '');

          for (const row of sess.entries) {
            const msId = getMsId(row.memberName);
            if (!msId) continue;

            const cols: Array<{ type: string; amount: number; txType: string }> = [
              { type: 'INSCRIPTION', amount: num(row.inscription), txType: 'INS' },
              { type: 'SECOURS', amount: num(row.secours), txType: 'SEC' },
              { type: 'COTISATION', amount: num(row.tontine), txType: 'COT' },
              { type: 'POT', amount: num(row.pot), txType: 'POT' },
              { type: 'EPARGNE', amount: num(row.epargne), txType: 'EP' },
              { type: 'PROJET', amount: num(row.projet), txType: 'PRJ' },
              { type: 'AUTRES', amount: num(row.autres), txType: 'AUT' },
            ];

            // Split remPret into RBT_PRINCIPAL and RBT_INTEREST using interest sheet data
            const remTotal = num(row.remPret);
            if (remTotal > 0) {
              const intRow = dto.interests.find((i) => norm(i.memberName) === norm(row.memberName));
              const monthInterest = intRow ? num(intRow.interests[sess.sessionNumber]) : 0;
              const principal = Math.max(0, remTotal - monthInterest);
              const interest = Math.min(monthInterest, remTotal);

              if (principal > 0) {
                cols.push({ type: 'RBT_PRINCIPAL', amount: principal, txType: 'RBP' });
              }
              if (interest > 0) {
                cols.push({ type: 'RBT_INTEREST', amount: interest, txType: 'RBI' });
              }
            }

            for (const col of cols) {
              if (col.amount <= 0) continue;

              sessionEntriesData.push({
                id: randomUUID(),
                reference: makeRef(fyLbl, sess.sessionNumber, col.txType, nextSeq(col.txType, sess.sessionNumber)),
                sessionId,
                membershipId: msId,
                type: col.type as any,
                amount: col.amount,
                isImported: true,
                recordedById: actorId,
              });

              // Accumulate totals
              const totalKey = `total${col.type.charAt(0)}${col.type.slice(1).toLowerCase().replace(/_([a-z])/g, (_, c) => c.toUpperCase())}`;
              if (totalKey in totals) {
                (totals as any)[totalKey] += col.amount;
              }
            }
          }
        }

        if (sessionEntriesData.length > 0) {
          await tx.sessionEntry.createMany({ data: sessionEntriesData });
        }

        // Update session totals
        // We still need to loop for update, but it's only 12 queries.
        for (const [sessionId, totals] of sessionTotals) {
          await tx.monthlySession.update({
            where: { id: sessionId },
            data: {
              totalInscription: totals.totalInscription,
              totalSecours: totals.totalSecours,
              totalCotisation: totals.totalCotisation,
              totalPot: totals.totalPot,
              totalRbtPrincipal: totals.totalRbtPrincipal,
              totalRbtInterest: totals.totalRbtInterest,
              totalEpargne: totals.totalEpargne,
              totalProjet: totals.totalProjet,
              totalAutres: totals.totalAutres,
            },
          });
        }

        // 2i. Create LoanAccount per loan detected
        // Group disbursements by member and month
        const loanAccountsData: Prisma.LoanAccountCreateManyInput[] = [];
        const loanAccrualsData: Prisma.MonthlyLoanAccrualCreateManyInput[] = [];
        const loanRepaymentsData: Prisma.LoanRepaymentCreateManyInput[] = [];

        for (const loanRow of dto.loans) {
          const msId = getMsId(loanRow.memberName);
          if (!msId) continue;

          const disbursementMonths = Object.entries(loanRow.disbursements)
            .map(([m, amt]) => ({ month: Number(m), amount: num(amt) }))
            .filter((d) => d.amount > 0);

          if (disbursementMonths.length === 0) continue;

          // Distribute repayments and interest proportionally across loans
          // Simple approach: one loan per member with combined amounts
          const totalDisbursed = disbursementMonths.reduce((s, d) => s + d.amount, 0);
          const loanId = randomUUID();
          const firstMonth = Math.min(...disbursementMonths.map((d) => d.month));
          const outstanding = num(loanRow.outstanding);

          loanAccountsData.push({
            id: loanId,
            membershipId: msId,
            fiscalYearId: fyId,
            principalAmount: totalDisbursed,
            monthlyRate: tontineConfig.loanMonthlyRate,
            disbursedAt: monthDate(startDate, firstMonth - 1),
            disbursedById: actorId,
            dueBeforeDate: loanDueDate,
            status: outstanding <= 0 ? 'CLOSED' : 'ACTIVE',
            outstandingBalance: outstanding,
            totalInterestAccrued: num(loanRow.totalInterest),
            totalRepaid: num(loanRow.totalRepaid),
          });

          // 2j + 2k. Reconstitue l'évolution mensuelle du prêt (accruals + remboursements)
          const intRow = dto.interests.find((i) => norm(i.memberName) === norm(loanRow.memberName));
          const repRow = dto.repayments.find((r) => norm(r.memberName) === norm(loanRow.memberName));

          const timeline = reconstructLoanTimeline({
            disbursements: loanRow.disbursements ?? {},
            interests: intRow?.interests ?? {},
            repayments: repRow?.repayments ?? {},
          });

          for (const t of timeline) {
            const sessionId = sessionMap.get(t.month);
            if (!sessionId) continue;

            loanAccrualsData.push({
              id: randomUUID(),
              loanId,
              sessionId,
              month: t.month,
              balanceAtMonthStart: t.balanceAtMonthStart,
              interestAccrued: t.interestAccrued,
              balanceWithInterest: t.balanceWithInterest,
              repaymentReceived: t.repaymentReceived,
              balanceAtMonthEnd: t.balanceAtMonthEnd,
            });

            if (t.repaymentReceived > 0) {
              loanRepaymentsData.push({
                id: randomUUID(),
                loanId,
                sessionId,
                amount: t.repaymentReceived,
                principalPart: t.principalPart,
                interestPart: t.interestPart,
                balanceAfter: t.balanceAtMonthEnd,
              });
            }
          }
        }

        if (loanAccountsData.length > 0) {
          await tx.loanAccount.createMany({ data: loanAccountsData });
          await tx.monthlyLoanAccrual.createMany({ data: loanAccrualsData });
          if (loanRepaymentsData.length > 0) {
            await tx.loanRepayment.createMany({ data: loanRepaymentsData });
          }
        }

        // 2l. Create BeneficiarySchedule + 12 empty slots
        const scheduleId = randomUUID();
        await tx.beneficiarySchedule.create({
          data: { id: scheduleId, fiscalYearId: fyId },
        });

        const beneficiarySlotsData: Prisma.BeneficiarySlotCreateManyInput[] = [];

        for (let m = 1; m <= 12; m++) {
          const sessionId = sessionMap.get(m)!;
          beneficiarySlotsData.push({
            id: randomUUID(),
            scheduleId,
            sessionId,
            month: m,
            slotIndex: 0,
            status: 'UNASSIGNED',
          });
        }
        await tx.beneficiarySlot.createMany({ data: beneficiarySlotsData });

        // 2m. Create PoolParticipants (incl. comptes spéciaux du modèle CAYABASE)
        // initialBalance = épargne du poste (ligne ep+int : SECOURS/CAYA, BUREAU, AUTRES/FETE).
        // currentBalance = solde "vivant" (secours cumulé des membres pour RESCUE_FUND).
        await tx.poolParticipant.createMany({
          data: [
            {
              id: randomUUID(),
              fiscalYearId: fyId,
              type: 'RESCUE_FUND',
              label: SPECIAL_POOL_LABELS.RESCUE_FUND,
              initialBalance: specialAmounts.RESCUE_FUND,
              currentBalance: rescueTotalBalance,
              totalInterestReceived: 0,
            },
            {
              id: randomUUID(),
              fiscalYearId: fyId,
              type: 'BUREAU',
              label: SPECIAL_POOL_LABELS.BUREAU,
              initialBalance: specialAmounts.BUREAU,
              currentBalance: specialAmounts.BUREAU,
              totalInterestReceived: 0,
            },
            {
              id: randomUUID(),
              fiscalYearId: fyId,
              type: 'AUTRES_FETE',
              label: SPECIAL_POOL_LABELS.AUTRES_FETE,
              initialBalance: specialAmounts.AUTRES_FETE,
              currentBalance: specialAmounts.AUTRES_FETE,
              totalInterestReceived: 0,
            },
          ],
        });

        return {
          fiscalYearId: fyId,
          membersCreated: membersToCreate.length,
          membersMatched: memberNames.length - membersToCreate.length,
          sessionsCreated: 12,
          status: keepOpen ? ('ACTIVE' as const) : ('CLOSED' as const),
          openMonth: keepOpen && lastRecorded < 12 ? lastRecorded + 1 : null,
        };
      },
      { timeout: 120_000 },
    );

    return result;
  }
}
