'use strict';

/**
 * Script d'initialisation du super-admin CAYA.
 * Exécuté automatiquement après prisma db push lors du déploiement Hostinger.
 * Idempotent : ne recrée pas l'admin s'il existe déjà.
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const ADMIN_USERNAME = 'admin';
const ADMIN_PHONE    = '237600000000';
const ADMIN_PASSWORD = 'Admin2026NkapCAYA';

async function main() {
  console.log('[SEED] Initialisation du super-admin...');

  const prisma = new PrismaClient();

  try {
    // Vérifier si un super-admin existe déjà
    const existing = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' },
    });

    if (existing) {
      console.log('[SEED] ✓ Super-admin déjà existant:', existing.username);
      return;
    }

    // Créer le super-admin
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

    const admin = await prisma.user.create({
      data: {
        username:     ADMIN_USERNAME,
        phone:        ADMIN_PHONE,
        passwordHash: passwordHash,
        role:         'SUPER_ADMIN',
        isActive:     true,
        version:      1,
      },
    });

    console.log('[SEED] ════════════════════════════════════════');
    console.log('[SEED] ✓ Super-admin créé avec succès !');
    console.log('[SEED]   Username  :', ADMIN_USERNAME);
    console.log('[SEED]   Password  :', ADMIN_PASSWORD);
    console.log('[SEED]   Phone     :', ADMIN_PHONE);
    console.log('[SEED]   Role      : SUPER_ADMIN');
    console.log('[SEED]   ID        :', admin.id);
    console.log('[SEED] ════════════════════════════════════════');
    console.log('[SEED] ⚠️  Changez ce mot de passe en production !');

    } catch (err) {
      console.error('[SEED] ✗ Erreur lors de la création du super-admin:', err.message);
      // Ne pas faire échouer le déploiement
    }

    try {
      const config = await prisma.tontineConfig.findUnique({ where: { id: 'caya' } });
      if (!config) {
        console.log('[SEED] Initialisation de la configuration CAYA par défaut...');
        
        // Find super admin for audit
        const adminForAudit = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
        const auditId = adminForAudit ? adminForAudit.id : admin.id;

        await prisma.tontineConfig.create({
          data: {
            id: 'caya',
            name: 'CAYA Tontine',
            acronym: 'CAYA',
            foundedYear: 2024,
            shareUnitAmount: 10000,
            loanMonthlyRate: 0.04,
            maxLoanMultiplier: 5,
            minSavingsToLoan: 50000,
            maxConcurrentLoans: 2,
            rescueFundTarget: 1000000,
            rescueFundMinBalance: 500000,
            registrationFeeNew: 10000,
            registrationFeeReturning: 5000,
            updatedById: auditId,
          }
        });
        
        // Rescue event amounts - Match RescueEventType exactly
        await prisma.rescueEventAmount.createMany({
          data: [
            { eventType: 'MEMBER_DEATH',   amount: 500000, label: 'Décès membre',   updatedById: auditId },
            { eventType: 'RELATIVE_DEATH', amount: 150000, label: 'Décès proche',   updatedById: auditId },
            { eventType: 'MARRIAGE',       amount: 50000,  label: 'Mariage',        updatedById: auditId },
            { eventType: 'BIRTH',          amount: 25000,  label: 'Naissance',      updatedById: auditId },
            { eventType: 'ILLNESS',        amount: 50000,  label: 'Maladie/Soutien', updatedById: auditId },
            { eventType: 'PROMOTION',      amount: 25000,  label: 'Voeux/Promotion', updatedById: auditId },
          ]
        });
        console.log('[SEED] ✓ Configuration CAYA de base créée');
      } else {
        console.log('[SEED] ✓ Configuration CAYA déjà existante');
      }
    } catch (err) {
      console.error('[SEED] ✗ Erreur lors de la configuration CAYA:', err.message);
    } finally {
      await prisma.$disconnect();
    }
}

main();
