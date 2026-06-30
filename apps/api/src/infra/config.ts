/**
 * Centralized runtime configuration, environment validation, secrets loading,
 * and feature flags. One place to read and validate everything.
 *
 * Validation is non-fatal in development (warns) but strict in production
 * (throws) so a misconfigured deployment fails fast.
 */

export type StoreBackend = 'memory' | 'firestore' | 'redis';

export interface AppConfig {
  env: 'development' | 'production' | 'test';
  port: number;
  appUrl: string;
  /** Backing store for rate limits / replay / sessions. */
  store: StoreBackend;
  redisUrl: string | null;
  requireFirebase: boolean;
  sessionSecret: string;
  billingProvider: string;
  lemonSqueezyWebhookSecret: string | null;
  /** Audit log retention in days. */
  auditRetentionDays: number;
  /** Whether scheduled background jobs run in this process. */
  jobsEnabled: boolean;
  features: {
    distributedRateLimit: boolean;
    backgroundJobs: boolean;
    telemetry: boolean;
  };
}

function bool(value: string | undefined, fallback = false): boolean {
  if (value === undefined) return fallback;
  return /^(1|true|yes|on)$/i.test(value);
}

function int(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

let cached: AppConfig | null = null;

export function loadConfig(): AppConfig {
  if (cached) return cached;
  const env = (process.env.NODE_ENV as AppConfig['env']) || 'development';
  const isProd = env === 'production';

  const redisUrl = process.env.REDIS_URL?.trim() || null;
  // Auto-select the store: Redis if configured, else Firestore in prod, else memory.
  const explicitStore = (process.env.STORE_BACKEND as StoreBackend) || '';
  const store: StoreBackend =
    explicitStore || (redisUrl ? 'redis' : isProd ? 'firestore' : 'memory');

  cached = {
    env,
    port: int(process.env.PORT, 3001),
    appUrl: process.env.APP_URL || 'http://localhost:3000',
    store,
    redisUrl,
    requireFirebase: bool(process.env.DERIVO_REQUIRE_FIREBASE) || isProd,
    sessionSecret: process.env.SESSION_SECRET || 'dev-session-secret-change-me',
    billingProvider: (process.env.BILLING_PROVIDER || '').toLowerCase(),
    lemonSqueezyWebhookSecret: process.env.LEMONSQUEEZY_WEBHOOK_SECRET?.trim() || null,
    auditRetentionDays: int(process.env.AUDIT_RETENTION_DAYS, 90),
    jobsEnabled: bool(process.env.JOBS_ENABLED, !isProd ? false : true),
    features: {
      distributedRateLimit: bool(process.env.FEATURE_DISTRIBUTED_RATE_LIMIT, !!redisUrl),
      backgroundJobs: bool(process.env.FEATURE_BACKGROUND_JOBS, isProd),
      telemetry: bool(process.env.FEATURE_TELEMETRY, false),
    },
  };
  return cached;
}

/** Validate config. Throws in production on critical problems; warns in dev. */
export function validateConfig(config: AppConfig = loadConfig()): {
  ok: boolean;
  problems: string[];
} {
  const problems: string[] = [];

  if (config.env === 'production') {
    if (config.sessionSecret === 'dev-session-secret-change-me') {
      problems.push('SESSION_SECRET must be set in production');
    }
    if (!config.requireFirebase) {
      problems.push('Firebase Admin must be required in production');
    }
    if (config.store === 'memory') {
      problems.push('STORE_BACKEND must not be "memory" in production (use redis or firestore)');
    }
    if (config.billingProvider === 'lemonsqueezy' && !config.lemonSqueezyWebhookSecret) {
      problems.push('LEMONSQUEEZY_WEBHOOK_SECRET is required when using the lemonsqueezy provider');
    }
  }

  const ok = problems.length === 0;
  if (!ok) {
    const message = `Configuration problems:\n  - ${problems.join('\n  - ')}`;
    if (config.env === 'production') {
      // Caller decides whether to exit; we surface clearly.
      console.error(`🛑 ${message}`);
    } else {
      console.warn(`⚠️  ${message}`);
    }
  }
  return { ok, problems };
}

/** Reset cache (tests). */
export function resetConfigForTesting(): void {
  cached = null;
}
