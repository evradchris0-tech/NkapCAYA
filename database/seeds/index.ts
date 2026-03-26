import { PrismaClient, BureauRole, RescueEventType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Seeding CAYA database...');

  // ── SUPER_ADMIN initial ──────────────────────────────────────
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

  console.log(`  ✔ SUPER_ADMIN créé : ${admin.username} (${admin.id})`);

  // ── TontineConfig (singleton id='caya') ──────────────────────
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

  console.log(`  ✔ TontineConfig créé : ${tontineConfig.name} (${tontineConfig.id})`);

  // ── RescueEventAmounts ───────────────────────────────────────
  const rescueAmounts: {
    eventType: RescueEventType;
    label: string;
    amount: number;
  }[] = [
    { eventType: RescueEventType.MEMBER_DEATH,   label: 'Décès du membre',        amount: 100000 },
    { eventType: RescueEventType.RELATIVE_DEATH, label: 'Décès proche famille',   amount: 50000  },
    { eventType: RescueEventType.MARRIAGE,        label: 'Mariage du membre',      amount: 30000  },
    { eventType: RescueEventType.BIRTH,           label: 'Naissance / adoption',   amount: 20000  },
    { eventType: RescueEventType.ILLNESS,         label: 'Hospitalisation membre', amount: 25000  },
    { eventType: RescueEventType.PROMOTION,       label: 'Promotion professionnelle', amount: 15000 },
  ];

  for (const entry of rescueAmounts) {
    await prisma.rescueEventAmount.upsert({
      where: { eventType: entry.eventType },
      update: {},
      create: {
        eventType: entry.eventType,
        label: entry.label,
        amount: entry.amount,
        updatedById: admin.id,
      },
    });
    console.log(`  ✔ RescueEventAmount : ${entry.label} → ${entry.amount} XAF`);
  }

  console.log('✅ Seed terminé.');
}

main()
  .catch((e) => {
    console.error('❌ Erreur seed :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
