/**
 * Post-build: cree api-start.js a la racine qui pointe vers apps/api/dist/main.js
 */
const { existsSync, writeFileSync } = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const MAIN = path.join(ROOT, 'apps', 'api', 'dist', 'main.js');

if (!existsSync(MAIN)) {
  console.error('ERREUR: apps/api/dist/main.js introuvable.');
  process.exit(1);
}
console.log('dist/main.js: OK');

// Creer api-start.js a la racine
writeFileSync(
  path.join(ROOT, 'api-start.js'),
  `'use strict';
console.log('[CAYA API] Starting...');
console.log('[CAYA API] cwd:', process.cwd());
console.log('[CAYA API] PORT:', process.env.PORT);
try {
  require('./apps/api/dist/main');
} catch (err) {
  console.error('[CAYA API] FATAL:', err.message);
  console.error(err.stack);
  process.exit(1);
}
`,
);
console.log('api-start.js created at root');

// Verification
const nestCore = path.join(ROOT, 'node_modules', '@nestjs', 'core', 'package.json');
const prisma = path.join(ROOT, 'node_modules', '@prisma', 'client', 'package.json');
console.log('@nestjs/core: ' + (existsSync(nestCore) ? 'OK' : 'MANQUANT'));
console.log('@prisma/client: ' + (existsSync(prisma) ? 'OK' : 'MANQUANT'));
console.log('API build ready');
