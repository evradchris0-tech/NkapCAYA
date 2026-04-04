const path = require('path');
const fs = require('fs');

/**
 * Script de lancement pour Hostinger (LiteSpeed / Passenger)
 * Hostinger passe souvent un Named Pipe ou Socket Unix dans process.env.PORT
 * Next.js essaie de le forcer en nombre et échoue. Ce script contourne le problème.
 */
const port = process.env.PORT || 3000;
const hostname = process.env.HOSTNAME || '0.0.0.0';

console.log(`[CAYA WEB] Démarrage Frontend - Port paramétré par Hostinger: ${port}`);

// Initialisation manuelle du serveur Next.js en mode standalone
const { parse } = require('url');
const NextServer = require('next/dist/server/next-server').default;

const app = new NextServer({
  hostname,
  port: typeof port === 'string' && port.includes('.sock') ? 0 : port, // Fallback interne
  dir: __dirname,
  dev: false,
  conf: {
    env: {},
    webpack: null,
    webpackDevMiddleware: null,
    eslint: { ignoreDuringBuilds: false },
    typescript: { ignoreBuildErrors: false, tsconfigPath: 'tsconfig.json' },
    distDir: './.next',
    cleanDistDir: true,
    assetPrefix: '',
    configOrigin: 'next.config.js',
    useFileSystemPublicRoutes: true,
    generateEtags: true,
    pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
    target: 'server',
    poweredByHeader: true,
    compress: true,
    analyticsId: '',
    images: {
      deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
      imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
      path: '/_next/image',
      loader: 'default',
      loaderFile: '',
      domains: [],
      disableStaticImages: false,
      minimumCacheTTL: 60,
      formats: ['image/webp'],
      dangerouslyAllowSVG: false,
      contentSecurityPolicy: "script-src 'none'; frame-src 'none'; sandbox;",
      contentDispositionType: 'inline',
      remotePatterns: [],
      unoptimized: false,
    },
    devIndicators: { buildActivity: true, buildActivityPosition: 'bottom-right' },
    onDemandEntries: { maxInactiveAge: 15000, pagesBufferLength: 2 },
    compiler: {},
    experimental: {
      serverMinification: true,
      serverSourceMaps: false,
      trustHostHeader: false,
    },
  },
});

const http = require('http');

app.prepare().then(() => {
  const server = http.createServer((req, res) => {
    // Laisser le serveur statique de Next gérer les fichiers de public/ et .next/static/
    try {
      const parsedUrl = parse(req.url, true);
      app.getRequestHandler()(req, res, parsedUrl);
    } catch (err) {
      console.error('[CAYA WEB] Erreur lors du traitement de la requête', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  server.on('error', (err) => {
    console.error('[CAYA WEB] Erreur Serveur:', err);
    process.exit(1);
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`[CAYA WEB] 🚀 Prêt sur le port/socket fourni par l'hébergeur`);
  });
}).catch(err => {
  console.error('[CAYA WEB] Erreur de préparation Next.js', err);
  process.exit(1);
});
