'use strict';
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
