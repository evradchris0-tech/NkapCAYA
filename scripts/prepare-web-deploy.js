/**
 * Post-build script pour Hostinger Node.js hosting.
 * Aplatit la structure monorepo standalone en un dossier _deploy/
 * avec server.js à la racine, prêt pour Hostinger.
 */
const { cpSync, mkdirSync, existsSync } = require('fs');
const path = require('path');

const STANDALONE = path.join(__dirname, '..', 'apps', 'web', '.next', 'standalone');
const DEPLOY = path.join(__dirname, '..', '_deploy');
const STATIC_SRC = path.join(__dirname, '..', 'apps', 'web', '.next', 'static');
const PUBLIC_SRC = path.join(__dirname, '..', 'apps', 'web', 'public');

// Nettoyer
if (existsSync(DEPLOY)) {
  require('fs').rmSync(DEPLOY, { recursive: true });
}
mkdirSync(DEPLOY, { recursive: true });

// 1) Copier l'app (server.js, .next, node_modules local)
const appDir = path.join(STANDALONE, 'apps', 'web');
if (existsSync(appDir)) {
  console.log('Layout monorepo: apps/web/server.js');
  cpSync(appDir, DEPLOY, { recursive: true });
} else {
  console.log('Layout standard: server.js à la racine');
  cpSync(STANDALONE, DEPLOY, { recursive: true });
}

// 2) Merger les node_modules racine (contient next, react, etc.)
const rootNM = path.join(STANDALONE, 'node_modules');
if (existsSync(rootNM)) {
  const destNM = path.join(DEPLOY, 'node_modules');
  mkdirSync(destNM, { recursive: true });
  cpSync(rootNM, destNM, { recursive: true, force: false });
  console.log('Root node_modules merged');
}

// 3) Fichiers statiques
const staticDest = path.join(DEPLOY, '.next', 'static');
if (existsSync(STATIC_SRC)) {
  mkdirSync(staticDest, { recursive: true });
  cpSync(STATIC_SRC, staticDest, { recursive: true });
  console.log('Static files copied');
}

// 4) Public
if (existsSync(PUBLIC_SRC)) {
  cpSync(PUBLIC_SRC, path.join(DEPLOY, 'public'), { recursive: true });
  console.log('Public files copied');
}

// Vérification
const serverJs = path.join(DEPLOY, 'server.js');
const nextPkg = path.join(DEPLOY, 'node_modules', 'next', 'package.json');
console.log(`server.js: ${existsSync(serverJs) ? 'OK' : 'MANQUANT'}`);
console.log(`next module: ${existsSync(nextPkg) ? 'OK' : 'MANQUANT'}`);
console.log('_deploy/ ready');
