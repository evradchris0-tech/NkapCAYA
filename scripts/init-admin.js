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
    // Ne pas faire échouer le déploiement si le seed échoue
  } finally {
    await prisma.$disconnect();
  }
}

main();
