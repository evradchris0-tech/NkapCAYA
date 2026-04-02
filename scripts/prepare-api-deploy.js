/**
 * Post-build script pour deployer l'API NestJS sur Hostinger Node.js hosting.
 * Cree _api_deploy/ avec dist/ et index.js.
 * node_modules est resolu automatiquement via la racine (Node.js module resolution).
 */
const { cpSync, mkdirSync, existsSync, writeFileSync } = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const API_DIST = path.join(ROOT, 'apps', 'api', 'dist');
const DEPLOY = path.join(ROOT, '_api_deploy');

// Nettoyer
if (existsSync(DEPLOY)) {
  require('fs').rmSync(DEPLOY, { recursive: true });
}
mkdirSync(DEPLOY, { recursive: true });

// 1) Copier dist/
if (!existsSync(API_DIST)) {
  console.error('ERREUR: apps/api/dist/ introuvable.');
  process.exit(1);
}
cpSync(API_DIST, path.join(DEPLOY, 'dist'), { recursive: true });
console.log('dist/ copied');

// 2) Creer index.js (point d'entree)
writeFileSync(
  path.join(DEPLOY, 'index.js'),
  `'use strict';\nrequire('./dist/main');\n`,
);
console.log('index.js created');

// 3) Creer package.json minimal
writeFileSync(
  path.join(DEPLOY, 'package.json'),
  JSON.stringify({
    name: 'caya-api',
    version: '1.0.0',
    private: true,
    main: 'index.js',
    scripts: { start: 'node index.js' },
  }, null, 2),
);
console.log('package.json created');

// Verification
const checks = {
  'index.js': existsSync(path.join(DEPLOY, 'index.js')),
  'dist/main.js': existsSync(path.join(DEPLOY, 'dist', 'main.js')),
  '@nestjs/core (root)': existsSync(path.join(ROOT, 'node_modules', '@nestjs', 'core', 'package.json')),
  '@prisma/client (root)': existsSync(path.join(ROOT, 'node_modules', '@prisma', 'client', 'package.json')),
};
for (const [name, ok] of Object.entries(checks)) {
  console.log(`${name}: ${ok ? 'OK' : 'MANQUANT'}`);
}
console.log('_api_deploy/ ready');
