import {
  PrismaClient,
  BureauRole,
  RescueEventType,
  FiscalYearStatus,
  MemberStatus,
  EnrollmentType,
  LoanStatus,
  SavingsEntryType,
  InterestPoolMethod,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Seeding CAYA database...');

  // ── SUPER_ADMIN initial ──────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('Caya@2026!', 12);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      phone: '237600000000',
      passwordHash,
      role: BureauRole.SUPER_ADMIN,
      isActive: true,
    },
  });
  console.log(`  ✔ SUPER_ADMIN : ${admin.username} (${admin.id})`);

  // ── TontineConfig (singleton id='caya') ─────────────────────────────────
  const tontineConfig = await prisma.tontineConfig.upsert({
    where: { id: 'caya' },
    update: {},
    create: {
      id: 'caya',
      name: 'Caisse Autonome des Yaourtiers Associés',
      acronym: 'CAYA',
      foundedYear: 2020,
      motto: 'Ensemble, bâtissons notre avenir financier',
      headquartersCity: 'Yaoundé',
      shareUnitAmount: 100000,
      halfShareAmount: 50000,
      potMonthlyAmount: 3000,
      maxSharesPerMember: 10,
      mandatoryInitialSavings: 100000,
      loanMonthlyRate: 0.04,
      minLoanAmount: 10000,
      maxLoanAmount: 1000000,
      maxLoanMultiplier: 5,
      minSavingsToLoan: 100000,
      maxConcurrentLoans: 2,
      rescueFundTarget: 50000,
      rescueFundMinBalance: 25000,
      registrationFeeNew: 5000,
      registrationFeeReturning: 2000,
      updatedById: admin.id,
    },
  });
  console.log(`  ✔ TontineConfig : ${tontineConfig.name}`);

  // ── RescueEventAmounts ───────────────────────────────────────────────────
  const rescueAmounts: { eventType: RescueEventType; label: string; amount: number }[] = [
    { eventType: RescueEventType.MEMBER_DEATH,   label: 'Décès du membre',           amount: 100000 },
    { eventType: RescueEventType.RELATIVE_DEATH, label: 'Décès proche famille',      amount: 50000  },
    { eventType: RescueEventType.MARRIAGE,        label: 'Mariage du membre',         amount: 30000  },
    { eventType: RescueEventType.BIRTH,           label: 'Naissance / adoption',      amount: 20000  },
    { eventType: RescueEventType.ILLNESS,         label: 'Hospitalisation membre',    amount: 25000  },
    { eventType: RescueEventType.PROMOTION,       label: 'Promotion professionnelle', amount: 15000  },
  ];
  for (const entry of rescueAmounts) {
    await prisma.rescueEventAmount.upsert({
      where: { eventType: entry.eventType },
      update: {},
      create: { ...entry, updatedById: admin.id },
    });
  }
  console.log(`  ✔ RescueEventAmounts (${rescueAmounts.length})`);

  // ════════════════════════════════════════════════════════════════════════
  // MEMBRE DE TEST — accès complet à toutes les features
  // Identifiants : marie.nkeng / Membre@2026!
  // ════════════════════════════════════════════════════════════════════════

  // ── 1. User membre ───────────────────────────────────────────────────────
  const memberHash = await bcrypt.hash('Membre@2026!', 12);
  const memberUser = await prisma.user.upsert({
    where: { username: 'marie.nkeng' },
    update: {},
    create: {
      username: 'marie.nkeng',
      phone: '237691234567',
      passwordHash: memberHash,
      role: BureauRole.MEMBRE,
      isActive: true,
    },
  });
  console.log(`  ✔ Membre user : ${memberUser.username} (${memberUser.id})`);

  // ── 2. MemberProfile ────────────────────────────────────────────────────
  const memberProfile = await prisma.memberProfile.upsert({
    where: { userId: memberUser.id },
    update: {},
    create: {
      memberCode: 'CAYA-001',
      userId: memberUser.id,
      firstName: 'Marie',
      lastName: 'Nkeng',
      phone1: '237691234567',
      phone2: '237677654321',
      neighborhood: 'Bastos',
      locationDetail: 'Rue des Ambassades',
      mobileMoneyType: 'Orange Money',
      mobileMoneyNumber: '237691234567',
    },
  });
  console.log(`  ✔ MemberProfile : ${memberProfile.memberCode} — ${memberProfile.firstName} ${memberProfile.lastName}`);

  // ── 3. FiscalYear 2026 (ACTIVE) ─────────────────────────────────────────
  const fiscalYear = await prisma.fiscalYear.upsert({
    where: { label: '2026' },
    update: { status: FiscalYearStatus.ACTIVE },
    create: {
      label: '2026',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      cassationDate: new Date('2026-12-15'),
      loanDueDate: new Date('2026-11-30'),
      status: FiscalYearStatus.ACTIVE,
      openedAt: new Date('2026-01-15'),
      openedById: admin.id,
    },
  });
  console.log(`  ✔ FiscalYear : ${fiscalYear.label} (${fiscalYear.status}) — id: ${fiscalYear.id}`);

  // ── 4. FiscalYearConfig snapshot ────────────────────────────────────────
  await prisma.fiscalYearConfig.upsert({
    where: { fiscalYearId: fiscalYear.id },
    update: {},
    create: {
      id: randomUUID(),
      fiscalYearId: fiscalYear.id,
      snapshotById: admin.id,
      shareUnitAmount: 100000,
      loanMonthlyRate: 0.04,
      maxLoanMultiplier: 5,
      minSavingsToLoan: 100000,
      maxConcurrentLoans: 2,
      rescueFundTarget: 50000,
      rescueFundMinBalance: 25000,
      registrationFeeNew: 5000,
      registrationFeeReturning: 2000,
      interestPoolMethod: InterestPoolMethod.THEORETICAL,
    },
  });
  console.log(`  ✔ FiscalYearConfig snapshot`);

  // ── 5. Membership ACTIVE ────────────────────────────────────────────────
  const membership = await prisma.membership.upsert({
    where: {
      profileId_fiscalYearId: {
        profileId: memberProfile.id,
        fiscalYearId: fiscalYear.id,
      },
    },
    update: {},
    create: {
      profileId: memberProfile.id,
      fiscalYearId: fiscalYear.id,
      status: MemberStatus.ACTIVE,
      joinedAt: new Date('2026-01-15'),
      joinedAtMonth: 1,
      enrollmentType: EnrollmentType.NEW,
      registrationFeePaid: true,
      initialSavingsPaid: true,
      rescueContribPaid: true,
    },
  });
  console.log(`  ✔ Membership : ACTIVE — id: ${membership.id}`);

  // ── 6. ShareCommitment (2 parts) ────────────────────────────────────────
  await prisma.shareCommitment.upsert({
    where: { membershipId: membership.id },
    update: {},
    create: {
      id: randomUUID(),
      membershipId: membership.id,
      sharesCount: 2,
      monthlyAmount: 200000,
      isLocked: false,
    },
  });
  console.log(`  ✔ ShareCommitment : 2 parts × 100 000 XAF`);

  // ── 7. SavingsLedger avec solde ─────────────────────────────────────────
  const savingsLedger = await prisma.savingsLedger.upsert({
    where: { membershipId: membership.id },
    update: {
      balance: 650000,
      principalBalance: 600000,
      totalInterestReceived: 50000,
    },
    create: {
      membershipId: membership.id,
      balance: 650000,
      principalBalance: 600000,
      totalInterestReceived: 50000,
    },
  });
  console.log(`  ✔ SavingsLedger : ${savingsLedger.balance} XAF`);

  // ── 8. SavingsEntries (historique de transactions) ──────────────────────
  const existingEntries = await prisma.savingsEntry.count({
    where: { ledgerId: savingsLedger.id },
  });
  if (existingEntries === 0) {
    const deposits = [
      { month: 1, amount: 100000, balanceAfter: 100000, type: SavingsEntryType.DEPOSIT  },
      { month: 2, amount: 100000, balanceAfter: 200000, type: SavingsEntryType.DEPOSIT  },
      { month: 2, amount: 16500,  balanceAfter: 216500, type: SavingsEntryType.INTEREST_CREDIT },
      { month: 3, amount: 100000, balanceAfter: 316500, type: SavingsEntryType.DEPOSIT  },
      { month: 3, amount: 16500,  balanceAfter: 333000, type: SavingsEntryType.INTEREST_CREDIT },
      { month: 4, amount: 100000, balanceAfter: 433000, type: SavingsEntryType.DEPOSIT  },
      { month: 5, amount: 100000, balanceAfter: 533000, type: SavingsEntryType.DEPOSIT  },
      { month: 5, amount: 17000,  balanceAfter: 550000, type: SavingsEntryType.INTEREST_CREDIT },
      { month: 6, amount: 100000, balanceAfter: 650000, type: SavingsEntryType.DEPOSIT  },
    ];
    await prisma.savingsEntry.createMany({
      data: deposits.map((d) => ({
        id: randomUUID(),
        ledgerId: savingsLedger.id,
        month: d.month,
        amount: d.amount,
        type: d.type,
        balanceAfter: d.balanceAfter,
        createdAt: new Date(`2026-0${d.month}-15`),
      })),
    });
    console.log(`  ✔ SavingsEntries : ${deposits.length} transactions`);
  } else {
    console.log(`  ⏭  SavingsEntries : déjà présentes (${existingEntries})`);
  }

  // ── 9. RescueFundLedger (global pour l'exercice) ─────────────────────────
  const rescueLedger = await prisma.rescueFundLedger.upsert({
    where: { fiscalYearId: fiscalYear.id },
    update: {},
    create: {
      fiscalYearId: fiscalYear.id,
      totalBalance: 200000,
      targetPerMember: 50000,
      minimumPerMember: 25000,
      memberCount: 4,
      targetTotal: 200000,
    },
  });
  console.log(`  ✔ RescueFundLedger : ${rescueLedger.totalBalance} XAF total`);

  // ── 10. RescueFundPosition (position du membre) ──────────────────────────
  await prisma.rescueFundPosition.upsert({
    where: { membershipId: membership.id },
    update: {},
    create: {
      membershipId: membership.id,
      ledgerId: rescueLedger.id,
      paidAmount: 50000,
      balance: 50000,
      refillDebt: 0,
    },
  });
  console.log(`  ✔ RescueFundPosition : 50 000 XAF versés`);

  // ── 11. LoanAccount ACTIVE ──────────────────────────────────────────────
  const existingLoan = await prisma.loanAccount.findFirst({
    where: { membershipId: membership.id, status: LoanStatus.ACTIVE },
  });
  if (!existingLoan) {
    await prisma.loanAccount.create({
      data: {
        membershipId: membership.id,
        fiscalYearId: fiscalYear.id,
        principalAmount: 300000,
        monthlyRate: 0.04,
        disbursedAt: new Date('2026-02-01'),
        disbursedById: admin.id,
        dueBeforeDate: new Date('2026-11-30'),
        status: LoanStatus.ACTIVE,
        outstandingBalance: 248000,
        totalInterestAccrued: 24000,
        totalRepaid: 76000,
        requestNotes: 'Achat équipements professionnels',
        requestedAt: new Date('2026-01-28'),
      },
    });
    console.log(`  ✔ LoanAccount ACTIVE : 300 000 XAF (encours : 248 000 XAF)`);
  } else {
    console.log(`  ⏭  LoanAccount ACTIVE : déjà présent`);
  }

  // ── 12. LoanAccount PENDING ─────────────────────────────────────────────
  const existingPendingLoan = await prisma.loanAccount.findFirst({
    where: { membershipId: membership.id, status: LoanStatus.PENDING },
  });
  if (!existingPendingLoan) {
    await prisma.loanAccount.create({
      data: {
        membershipId: membership.id,
        fiscalYearId: fiscalYear.id,
        principalAmount: 150000,
        monthlyRate: 0.04,
        dueBeforeDate: new Date('2026-11-30'),
        status: LoanStatus.PENDING,
        outstandingBalance: 0,
        totalInterestAccrued: 0,
        totalRepaid: 0,
        requestNotes: 'Frais de scolarité',
        requestedAt: new Date('2026-03-10'),
      },
    });
    console.log(`  ✔ LoanAccount PENDING : 150 000 XAF en attente d'approbation`);
  } else {
    console.log(`  ⏭  LoanAccount PENDING : déjà présent`);
  }

  console.log('\n════════════════════════════════════════════════════════');
  console.log('✅ Seed terminé.');
  console.log('');
  console.log('  Identifiants admin   : admin / Caya@2026!');
  console.log('  Identifiants membre  : marie.nkeng / Membre@2026!');
  console.log('════════════════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Erreur seed :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
