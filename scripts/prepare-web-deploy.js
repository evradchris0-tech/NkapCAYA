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

// 3) Fichiers statiques internes
const staticDest = path.join(DEPLOY, '.next', 'static');
if (existsSync(STATIC_SRC)) {
  mkdirSync(staticDest, { recursive: true });
  cpSync(STATIC_SRC, staticDest, { recursive: true });
  // COPIE POUR HOSTINGER LITESPEED (qui cherche les assets à la racine)
  const litespeedStaticDest = path.join(__dirname, '..', '_next', 'static');
  mkdirSync(litespeedStaticDest, { recursive: true });
  cpSync(STATIC_SRC, litespeedStaticDest, { recursive: true });
  console.log('Static files copied (and exported for LiteSpeed)');
}

// 4) Fichiers publics (Images, favicon...)
if (existsSync(PUBLIC_SRC)) {
  cpSync(PUBLIC_SRC, path.join(DEPLOY, 'public'), { recursive: true });
  // COPIE POUR HOSTINGER LITESPEED (les images doivent être à la racine)
  cpSync(PUBLIC_SRC, path.join(__dirname, '..'), { recursive: true });
  console.log('Public files copied (and exported for LiteSpeed root)');
}

// 5) Créer un package.json minimal (requis par certains hébergeurs)
const deployPkg = {
  name: 'caya-web',
  version: '1.0.0',
  private: true,
  scripts: { start: 'node server.js' },
};
require('fs').writeFileSync(
  path.join(DEPLOY, 'package.json'),
  JSON.stringify(deployPkg, null, 2),
);
console.log('package.json created');

// 6) PATCH CRITIQUE DU server.js POUR HOSTINGER (LiteSpeed)
const serverJs = path.join(DEPLOY, 'server.js');
if (existsSync(serverJs)) {
  let content = require('fs').readFileSync(serverJs, 'utf8');
  
  // 1. Next.js convertit le PORT en entier, cassant les sockets Unix
  content = content.replace(
    /parseInt\(process\.env\.PORT,\s*10\)/g,
    'process.env.PORT'
  );
  
  // 2. Node.js crash si on lui passe 'localhost' en même temps qu'un socket !
  // On remplace 'server.listen(currentPort, hostname,' par 'server.listen(currentPort,'
  content = content.replace(
    /server\.listen\(currentPort,\s*hostname,/g,
    'server.listen(currentPort,'
  );
  
  require('fs').writeFileSync(serverJs, content);
  console.log('server.js PATCHÉ avec succès pour LiteSpeed Socket');
}

// Vérification
const nextPkg = path.join(DEPLOY, 'node_modules', 'next', 'package.json');
console.log(`server.js: ${existsSync(serverJs) ? 'OK' : 'MANQUANT'}`);
console.log(`next module: ${existsSync(nextPkg) ? 'OK' : 'MANQUANT'}`);

// 7) Nettoyage agressif des caches (Économie de ressources Hostinger)
console.log('🧹 Nettoyage des caches inutiles pour libérer l\'espace disque...');
const nextCache = path.join(__dirname, '..', 'apps', 'web', '.next', 'cache');
if (existsSync(nextCache)) {
  require('fs').rmSync(nextCache, { recursive: true, force: true });
  console.log('   ✓ Cache webpack Next.js supprimé');
}
if (existsSync(STANDALONE)) {
  require('fs').rmSync(STANDALONE, { recursive: true, force: true });
  console.log('   ✓ Source standalone purgée (déjà copiée dans _deploy/)');
}

console.log('_deploy/ ready');
