/**
 * Background job system: scheduled maintenance workers.
 *
 * Jobs are best-effort and self-contained. Each is gated on Firebase Admin
 * being available (they operate on Firestore); in mock/dev mode they report
 * `skipped` so the scheduler can be exercised by tests without a database.
 *
 * Gated by config (`jobsEnabled` / `features.backgroundJobs`) so only the
 * intended process runs them — avoid double-running across many instances by
 * enabling jobs on a single worker (or a dedicated cron) in production.
 */
import { getDb, isAdminInitialized } from '../firebase.js';
import { loadConfig } from './config.js';
import { logger } from './logger.js';
import { incr } from './metrics.js';

export interface JobResult {
  name: string;
  processed: number;
  skipped: boolean;
  error?: string;
}

export interface JobDefinition {
  name: string;
  intervalMs: number;
  run: () => Promise<JobResult>;
}

const DAY_MS = 24 * 60 * 60 * 1000;
// Devices untouched for this long with no active session are pruned.
const STALE_DEVICE_MS = 90 * DAY_MS;

/** Delete every document matched by a query, in bounded batches. */
async function deleteAll(
  query: FirebaseFirestore.Query,
  predicate: (data: FirebaseFirestore.DocumentData) => boolean,
): Promise<number> {
  const snap = await query.get();
  const db = getDb();
  let batch = db.batch();
  let inBatch = 0;
  let deleted = 0;
  for (const doc of snap.docs) {
    if (!predicate(doc.data())) continue;
    batch.delete(doc.ref);
    inBatch++;
    deleted++;
    if (inBatch >= 400) {
      await batch.commit();
      batch = db.batch();
      inBatch = 0;
    }
  }
  if (inBatch > 0) await batch.commit();
  return deleted;
}

function skipped(name: string): JobResult {
  return { name, processed: 0, skipped: true };
}

// ── Individual jobs ──────────────────────────────────────────────────────────

/** Expire trials whose trialEndsAt has passed (status trial/trialing). */
export async function runTrialExpiration(): Promise<JobResult> {
  const name = 'trial-expiration';
  if (!isAdminInitialized()) return skipped(name);
  const now = Date.now();
  const snap = await getDb().collection('subscriptions').get();
  const db = getDb();
  let processed = 0;
  for (const doc of snap.docs) {
    const d = doc.data() as { status?: string; trialEndsAt?: string | null; planId?: string };
    const isTrial = d.status === 'trial' || d.status === 'trialing';
    if (isTrial && d.trialEndsAt && Date.parse(d.trialEndsAt) <= now) {
      await db
        .collection('subscriptions')
        .doc(doc.id)
        .set(
          { status: 'expired', planId: 'free', updatedAt: new Date().toISOString() },
          { merge: true },
        );
      processed++;
    }
  }
  return { name, processed, skipped: false };
}

/** Expire grace/temporary access windows that have passed. */
export async function runTempAccessExpiration(): Promise<JobResult> {
  const name = 'temp-access-expiration';
  if (!isAdminInitialized()) return skipped(name);
  const now = Date.now();
  const snap = await getDb().collection('subscriptions').get();
  const db = getDb();
  let processed = 0;
  for (const doc of snap.docs) {
    const d = doc.data() as { status?: string; gracePeriodEndsAt?: string | null };
    if (d.status === 'grace' && d.gracePeriodEndsAt && Date.parse(d.gracePeriodEndsAt) <= now) {
      await db
        .collection('subscriptions')
        .doc(doc.id)
        .set(
          { status: 'expired', planId: 'free', updatedAt: new Date().toISOString() },
          { merge: true },
        );
      processed++;
    }
  }
  return { name, processed, skipped: false };
}

/** Remove revoked or fully-expired sessions across all users. */
export async function runSessionCleanup(): Promise<JobResult> {
  const name = 'session-cleanup';
  if (!isAdminInitialized()) return skipped(name);
  const now = Date.now();
  const processed = await deleteAll(getDb().collectionGroup('sessions'), (d) => {
    const expired = d.absoluteExpiresAt ? Date.parse(d.absoluteExpiresAt as string) <= now : false;
    return Boolean(d.revoked) || expired;
  });
  return { name, processed, skipped: false };
}

/** Remove stale devices that have not been seen for a long time. */
export async function runDeviceCleanup(): Promise<JobResult> {
  const name = 'device-cleanup';
  if (!isAdminInitialized()) return skipped(name);
  const cutoff = Date.now() - STALE_DEVICE_MS;
  const processed = await deleteAll(getDb().collectionGroup('devices'), (d) => {
    const lastSeen = d.lastSeenAt ? Date.parse(d.lastSeenAt as string) : 0;
    return Boolean(d.revoked) && lastSeen < cutoff;
  });
  return { name, processed, skipped: false };
}

/** Remove expired or used refresh tokens. */
export async function runRefreshTokenCleanup(): Promise<JobResult> {
  const name = 'refresh-token-cleanup';
  if (!isAdminInitialized()) return skipped(name);
  const now = Date.now();
  const processed = await deleteAll(getDb().collection('refreshTokens'), (d) => {
    const expired = d.expiresAt ? Date.parse(d.expiresAt as string) <= now : false;
    return Boolean(d.used) || expired;
  });
  return { name, processed, skipped: false };
}

/** Remove API keys whose expiry has passed. */
export async function runExpiredApiKeyCleanup(): Promise<JobResult> {
  const name = 'expired-api-key-cleanup';
  if (!isAdminInitialized()) return skipped(name);
  const now = Date.now();
  const processed = await deleteAll(getDb().collectionGroup('apiKeys'), (d) => {
    return Boolean(d.expiresAt) && Date.parse(d.expiresAt as string) <= now;
  });
  return { name, processed, skipped: false };
}

/** Delete audit logs older than the configured retention window. */
export async function runAuditRetention(): Promise<JobResult> {
  const name = 'audit-retention';
  if (!isAdminInitialized()) return skipped(name);
  const cutoff = Date.now() - loadConfig().auditRetentionDays * DAY_MS;
  const processed = await deleteAll(getDb().collectionGroup('auditLogs'), (d) => {
    return d.timestamp ? Date.parse(d.timestamp as string) < cutoff : false;
  });
  return { name, processed, skipped: false };
}

// ── Scheduler ────────────────────────────────────────────────────────────────

const HOUR = 60 * 60 * 1000;

export const jobDefinitions: JobDefinition[] = [
  { name: 'trial-expiration', intervalMs: HOUR, run: runTrialExpiration },
  { name: 'temp-access-expiration', intervalMs: HOUR, run: runTempAccessExpiration },
  { name: 'session-cleanup', intervalMs: 6 * HOUR, run: runSessionCleanup },
  { name: 'device-cleanup', intervalMs: 24 * HOUR, run: runDeviceCleanup },
  { name: 'refresh-token-cleanup', intervalMs: 6 * HOUR, run: runRefreshTokenCleanup },
  { name: 'expired-api-key-cleanup', intervalMs: 6 * HOUR, run: runExpiredApiKeyCleanup },
  { name: 'audit-retention', intervalMs: 24 * HOUR, run: runAuditRetention },
];

let timers: NodeJS.Timeout[] = [];

/** Execute a single job by definition, recording metrics + logs. */
export async function runJob(def: JobDefinition): Promise<JobResult> {
  incr('jobs.runs');
  try {
    const result = await def.run();
    if (!result.skipped)
      logger.info('job completed', { job: result.name, processed: result.processed });
    return result;
  } catch (err) {
    incr('jobs.failures');
    const message = err instanceof Error ? err.message : String(err);
    logger.error('job failed', { job: def.name, error: message });
    return { name: def.name, processed: 0, skipped: false, error: message };
  }
}

/** Run every job once (used at startup and by tests). */
export async function runAllJobsOnce(): Promise<JobResult[]> {
  const results: JobResult[] = [];
  for (const def of jobDefinitions) results.push(await runJob(def));
  return results;
}

/** Start the scheduler. No-op when jobs are disabled by config. */
export function startJobs(): boolean {
  const config = loadConfig();
  if (!config.jobsEnabled && !config.features.backgroundJobs) {
    logger.info('background jobs disabled');
    return false;
  }
  stopJobs();
  for (const def of jobDefinitions) {
    const timer = setInterval(() => {
      void runJob(def);
    }, def.intervalMs);
    // Don't keep the event loop alive solely for jobs.
    timer.unref?.();
    timers.push(timer);
  }
  logger.info('background jobs started', { count: jobDefinitions.length });
  return true;
}

/** Stop the scheduler and clear all timers. */
export function stopJobs(): void {
  for (const t of timers) clearInterval(t);
  timers = [];
}
