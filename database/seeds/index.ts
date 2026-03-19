import { PrismaClient, BureauRole } from '@prisma/client';
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
