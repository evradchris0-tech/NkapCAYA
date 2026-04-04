'use strict';

const path = require('path');
const fs   = require('fs');

// ── Charger .env si présent (Hostinger Node.js natif ne l'injecte pas toujours)
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
  console.log('[CAYA API] .env chargé depuis:', envPath);
}

console.log('[CAYA API] ════════════════════════════════');
console.log('[CAYA API] Démarrage CAYA Backend');
console.log('[CAYA API] cwd       :', process.cwd());
console.log('[CAYA API] __dirname :', __dirname);
console.log('[CAYA API] NODE_ENV  :', process.env.NODE_ENV);
console.log('[CAYA API] PORT      :', process.env.PORT);
console.log('[CAYA API] DB URL    :', process.env.DATABASE_URL ? '✓ définie' : '✗ MANQUANTE');
console.log('[CAYA API] ════════════════════════════════');

// ── Résoudre le chemin vers dist/main selon le contexte (monorepo ou déployé à plat)
const candidates = [
  path.join(__dirname, 'dist', 'main'),          // déployé à plat (_api_deploy/dist/main)
  path.join(__dirname, 'apps', 'api', 'dist', 'main'), // monorepo (Hostinger natif)
];

let entryFound = null;
for (const candidate of candidates) {
  const jsFile = candidate + '.js';
  if (fs.existsSync(jsFile)) {
    entryFound = candidate;
    console.log('[CAYA API] Entry point trouvé :', jsFile);
    break;
  }
}

if (!entryFound) {
  console.error('[CAYA API] ✗ FATAL: dist/main.js introuvable dans aucun chemin candidat:');
  candidates.forEach(c => console.error('  -', c + '.js'));
  console.error('[CAYA API] Contenu du répertoire courant:');
  try {
    fs.readdirSync(__dirname).forEach(f => console.error('  ', f));
  } catch (e) { /* ignore */ }
  process.exit(1);
}

try {
  require(entryFound);
} catch (err) {
  console.error('[CAYA API] ✗ FATAL au chargement:', err.message);
  console.error(err.stack);
  process.exit(1);
}
