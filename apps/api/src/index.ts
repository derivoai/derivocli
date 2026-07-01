import './load-env.js';
import type { Server } from 'http';
import { createApp } from './app.js';
import { initFirebase, isAdminInitialized } from './firebase.js';
import { loadConfig, validateConfig } from './infra/config.js';
import { getStore } from './infra/store.js';
import { startJobs, stopJobs } from './infra/jobs.js';
import { logger } from './infra/logger.js';

const config = loadConfig();
const port = config.port;

// ─── Firebase Admin bootstrap ────────────────────────────────────────────────
const { initialized, missing } = initFirebase();
if (initialized) {
  console.log('✅ Firebase Admin initialized successfully');
} else {
  console.log('ℹ️  Firebase Admin not configured — running in MOCK MODE.');
  console.log(`   Missing env var(s): ${missing.join(', ')}`);
  console.log('   In mock mode the API accepts ANY token and treats users as subscribed.');
}

// Safety guard: a production/hosted backend must NEVER run open.
if (!isAdminInitialized() && config.requireFirebase) {
  console.error('🛑 Refusing to start in mock mode: Firebase Admin credentials are required.');
  console.error(`   Set: ${missing.join(', ')}`);
  process.exit(1);
}

// ─── Configuration validation ────────────────────────────────────────────────
const { ok, problems } = validateConfig(config);
if (!ok && config.env === 'production') {
  console.error('🛑 Refusing to start: invalid production configuration.');
  for (const p of problems) console.error(`   - ${p}`);
  process.exit(1);
}

async function main(): Promise<void> {
  // Initialize the backing store early so readiness reflects reality.
  const store = await getStore();
  logger.info('store initialized', { backend: store.backend });

  const app = createApp();
  const server: Server = app.listen(port, () => {
    console.log(`🚀 API server running at http://localhost:${port}`);
    logger.info('server started', { port, env: config.env, store: store.backend });
  });

  // Background maintenance workers (gated by config).
  startJobs();

  setupGracefulShutdown(server);
}

// ─── Graceful shutdown ───────────────────────────────────────────────────────
function setupGracefulShutdown(server: Server): void {
  let shuttingDown = false;
  const shutdown = (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info('shutdown signal received, draining', { signal });
    stopJobs();
    // Stop accepting new connections, then exit once existing ones drain.
    server.close((err) => {
      if (err) {
        logger.error('error during shutdown', { error: err.message });
        process.exit(1);
      }
      logger.info('shutdown complete');
      process.exit(0);
    });
    // Hard cap so a hung connection can't block forever.
    setTimeout(() => {
      logger.warn('forced shutdown after timeout');
      process.exit(1);
    }, 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  logger.error('fatal startup error', { error: err instanceof Error ? err.message : String(err) });
  process.exit(1);
});
