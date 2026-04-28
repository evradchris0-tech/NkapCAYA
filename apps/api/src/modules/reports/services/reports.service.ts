import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { ReportsRepository } from '../repositories/reports.repository';
import { ImportFiscalYearDto } from '../dto/import-fiscal-year.dto';
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

  async generateMemberReport(_memberId: string, _fiscalYearId?: string, _format?: string) {
    throw new Error('Not implemented');
  }

  async generateSessionReport(_sessionId: string, _format?: string) {
    throw new Error('Not implemented');
  }

  /* ──────────────────────────────── IMPORT ──────────────────────────────── */

  async importFiscalYear(dto: ImportFiscalYearDto, actorId: string) {
    // Check label uniqueness
    const existing = await this.prisma.fiscalYear.findUnique({ where: { label: dto.label } });
    if (existing) throw new BadRequestException(`Un exercice avec le label "${dto.label}" existe déjà.`);

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

    for (const name of dto.members) {
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
        let seqCounter = Date.now() % 100000;
        for (const name of membersToCreate) {
          seqCounter++;
          const parts = name.trim().split(/\s+/);
          const lastName = parts[0] || 'INCONNU';
          const firstName = parts.slice(1).join(' ') || 'IMPORT';

          const phone = `+237600${String(seqCounter).padStart(6, '0')}`;
          const passwordHash = await bcrypt.hash(`Caya@Import${seqCounter}`, 10);
          const memberCode = `IMP${String(seqCounter).slice(-4)}`;

          const user = await tx.user.create({
            data: {
              id: randomUUID(),
              username: phone,
              phone,
              passwordHash,
              role: 'MEMBRE',
              isActive: true,
            },
          });

          const profile = await tx.memberProfile.create({
            data: {
              id: randomUUID(),
              userId: user.id,
              memberCode,
              firstName,
              lastName,
              phone1: phone,
              neighborhood: 'Importé',
            },
          });

          const key = norm(name);
          resolvedMembers.set(key, { profileId: profile.id, userId: user.id });
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
            status: 'CLOSED',
            isImported: true,
            openedAt: now,
            openedById: actorId,
            closedAt: now,
            closedById: actorId,
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
        const sessionMap = new Map<number, string>(); // sessionNumber → sessionId
        for (let m = 1; m <= 12; m++) {
          const sessionId = randomUUID();
          const meetingDate = monthDate(startDate, m - 1);
          await tx.monthlySession.create({
            data: {
              id: sessionId,
              fiscalYearId: fyId,
              sessionNumber: m,
              meetingDate,
              status: 'CLOSED',
              openedAt: now,
              openedById: actorId,
              closedAt: now,
              closedById: actorId,
            },
          });
          sessionMap.set(m, sessionId);
        }

        // 2e. Create Memberships + ShareCommitments
        const shareUnit = Number(tontineConfig.shareUnitAmount);
        const membershipMap = new Map<string, string>(); // normName → membershipId

        for (const name of dto.members) {
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

          await tx.membership.create({
            data: {
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
            },
          });

          await tx.shareCommitment.create({
            data: {
              id: randomUUID(),
              membershipId,
              sharesCount,
              monthlyAmount: sharesCount * shareUnit,
              isLocked: true,
              lockedAt: now,
              lockedById: actorId,
            },
          });

          membershipMap.set(key, membershipId);
        }

        // Helper: get membershipId by name
        const getMsId = (name: string): string | undefined => membershipMap.get(norm(name));

        // 2f. Create SavingsLedger + SavingsEntry per member
        for (const sav of dto.savings) {
          const msId = getMsId(sav.memberName);
          if (!msId) continue;

          const ledgerId = randomUUID();
          const totalDep = num(sav.totalDeposit);
          const totalInt = num(sav.totalInterest);

          await tx.savingsLedger.create({
            data: {
              id: ledgerId,
              membershipId: msId,
              balance: totalDep + totalInt,
              principalBalance: totalDep,
              totalInterestReceived: totalInt,
            },
          });

          // Deposit entries
          let runningBalance = 0;
          for (const [monthStr, amount] of Object.entries(sav.deposits)) {
            const m = Number(monthStr);
            const amt = num(amount);
            if (amt <= 0) continue;
            runningBalance += amt;
            await tx.savingsEntry.create({
              data: {
                id: randomUUID(),
                ledgerId,
                sessionId: sessionMap.get(m),
                month: m,
                amount: amt,
                type: 'DEPOSIT',
                balanceAfter: runningBalance,
              },
            });
          }

          // Interest entries
          for (const [monthStr, amount] of Object.entries(sav.interests)) {
            const m = Number(monthStr);
            const amt = num(amount);
            if (amt <= 0) continue;
            runningBalance += amt;
            await tx.savingsEntry.create({
              data: {
                id: randomUUID(),
                ledgerId,
                sessionId: sessionMap.get(m),
                month: m,
                amount: amt,
                type: 'INTEREST_CREDIT',
                balanceAfter: runningBalance,
              },
            });
          }
        }

        // 2g. Create RescueFundLedger + Positions
        const rescueData = dto.rescueFund;
        const memberCount = dto.members.length;
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

        for (const rf of rescueData) {
          const msId = getMsId(rf.memberName);
          if (!msId) continue;

          const totalContrib = Object.values(rf.contributions).reduce((s, v) => s + num(v), 0);
          const paidAmount = num(rf.inscription) + totalContrib;
          rescueTotalBalance += paidAmount;

          await tx.rescueFundPosition.create({
            data: {
              id: randomUUID(),
              membershipId: msId,
              ledgerId: rescueLedgerId,
              paidAmount,
              balance: paidAmount,
            },
          });
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

              await tx.sessionEntry.create({
                data: {
                  id: randomUUID(),
                  reference: makeRef(fyLbl, sess.sessionNumber, col.txType, nextSeq(col.txType, sess.sessionNumber)),
                  sessionId,
                  membershipId: msId,
                  type: col.type as any,
                  amount: col.amount,
                  isImported: true,
                  recordedById: actorId,
                },
              });

              // Accumulate totals
              const totalKey = `total${col.type.charAt(0)}${col.type.slice(1).toLowerCase().replace(/_([a-z])/g, (_, c) => c.toUpperCase())}`;
              if (totalKey in totals) {
                (totals as any)[totalKey] += col.amount;
              }
            }
          }
        }

        // Update session totals
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

          await tx.loanAccount.create({
            data: {
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
            },
          });

          // 2j. Create MonthlyLoanAccrual from interest sheet
          const intRow = dto.interests.find((i) => norm(i.memberName) === norm(loanRow.memberName));
          if (intRow) {
            for (const [monthStr, interest] of Object.entries(intRow.interests)) {
              const m = Number(monthStr);
              const intAmt = num(interest);
              const sessionId = sessionMap.get(m);
              if (!sessionId || intAmt <= 0) continue;

              await tx.monthlyLoanAccrual.create({
                data: {
                  id: randomUUID(),
                  loanId,
                  sessionId,
                  month: m,
                  balanceAtMonthStart: 0, // approximate: not fully computable from import
                  interestAccrued: intAmt,
                  balanceWithInterest: 0,
                  repaymentReceived: 0,
                  balanceAtMonthEnd: 0,
                },
              });
            }
          }

          // 2k. Create LoanRepayment from repayments sheet
          const repRow = dto.repayments.find((r) => norm(r.memberName) === norm(loanRow.memberName));
          if (repRow) {
            for (const [monthStr, amount] of Object.entries(repRow.repayments)) {
              const m = Number(monthStr);
              const amt = num(amount);
              const sessionId = sessionMap.get(m);
              if (!sessionId || amt <= 0) continue;

              // Split using interest data
              const monthInterest = intRow ? num(intRow.interests[m]) : 0;
              const interestPart = Math.min(monthInterest, amt);
              const principalPart = amt - interestPart;

              await tx.loanRepayment.create({
                data: {
                  id: randomUUID(),
                  loanId,
                  sessionId,
                  amount: amt,
                  principalPart,
                  interestPart,
                  balanceAfter: 0, // not fully computable
                },
              });
            }
          }
        }

        // 2l. Create BeneficiarySchedule + 12 empty slots
        const scheduleId = randomUUID();
        await tx.beneficiarySchedule.create({
          data: { id: scheduleId, fiscalYearId: fyId },
        });

        for (let m = 1; m <= 12; m++) {
          const sessionId = sessionMap.get(m)!;
          await tx.beneficiarySlot.create({
            data: {
              id: randomUUID(),
              scheduleId,
              sessionId,
              month: m,
              slotIndex: 0,
              status: 'UNASSIGNED',
            },
          });
        }

        // 2m. Create PoolParticipants
        await tx.poolParticipant.createMany({
          data: [
            {
              id: randomUUID(),
              fiscalYearId: fyId,
              type: 'RESCUE_FUND',
              label: 'Caisse de secours',
              initialBalance: 0,
              currentBalance: rescueTotalBalance,
              totalInterestReceived: 0,
            },
            {
              id: randomUUID(),
              fiscalYearId: fyId,
              type: 'BUREAU',
              label: 'Bureau',
              initialBalance: 0,
              currentBalance: 0,
              totalInterestReceived: 0,
            },
          ],
        });

        return {
          fiscalYearId: fyId,
          membersCreated: membersToCreate.length,
          membersMatched: dto.members.length - membersToCreate.length,
          sessionsCreated: 12,
        };
      },
      { timeout: 120_000 },
    );

    return result;
  }
}
