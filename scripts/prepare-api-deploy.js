/**
 * Post-build: cree _api_deploy/ autonome avec dist/, node_modules/ et index.js.
 * Installe les deps runtime dans _api_deploy/ pour que Hostinger les deploie.
 */
const { cpSync, mkdirSync, existsSync, writeFileSync } = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const API_DIR = path.join(ROOT, 'apps', 'api');
const API_DIST = path.join(API_DIR, 'dist');
const SCHEMA = path.join(ROOT, 'database', 'schema.prisma');
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

// 2) Copier schema.prisma
if (existsSync(SCHEMA)) {
  const destSchema = path.join(DEPLOY, 'database');
  mkdirSync(destSchema, { recursive: true });
  cpSync(SCHEMA, path.join(destSchema, 'schema.prisma'));
  console.log('schema.prisma copied');
}

// 3) Creer package.json avec les deps runtime
const apiPkg = require(path.join(API_DIR, 'package.json'));
const deployPkg = {
  name: 'caya-api',
  version: apiPkg.version || '1.0.0',
  private: true,
  main: 'index.js',
  scripts: {
    start: 'node index.js',
    postinstall: 'npx prisma generate --schema=database/schema.prisma',
  },
  dependencies: {
    ...apiPkg.dependencies,
    prisma: '^5.22.0',
  },
};
writeFileSync(path.join(DEPLOY, 'package.json'), JSON.stringify(deployPkg, null, 2));
console.log('package.json created');

// 4) npm install --production dans _api_deploy/
console.log('Installing runtime dependencies...');
try {
  execSync('npm install --production', {
    cwd: DEPLOY,
    stdio: 'inherit',
    timeout: 120000,
  });
  console.log('npm install OK');
} catch (err) {
  console.error('npm install failed:', err.message);
  process.exit(1);
}

// 5) Creer index.js (point d'entree)
writeFileSync(
  path.join(DEPLOY, 'index.js'),
  `'use strict';
console.log('[CAYA API] Starting...');
console.log('[CAYA API] cwd:', process.cwd());
console.log('[CAYA API] PORT:', process.env.PORT);
try {
  require('./dist/main');
} catch (err) {
  console.error('[CAYA API] FATAL:', err.message);
  console.error(err.stack);
  process.exit(1);
}
`,
);
console.log('index.js created');

// Verification
const destNM = path.join(DEPLOY, 'node_modules');
const checks = {
  'index.js': existsSync(path.join(DEPLOY, 'index.js')),
  'dist/main.js': existsSync(path.join(DEPLOY, 'dist', 'main.js')),
  '@nestjs/core': existsSync(path.join(destNM, '@nestjs', 'core', 'package.json')),
  '@prisma/client': existsSync(path.join(destNM, '@prisma', 'client', 'package.json')),
  '.prisma/client': existsSync(path.join(destNM, '.prisma', 'client')),
  'express': existsSync(path.join(destNM, 'express', 'package.json')),
};
for (const [name, ok] of Object.entries(checks)) {
  console.log(`${name}: ${ok ? 'OK' : 'MANQUANT'}`);
}
console.log('_api_deploy/ ready');
