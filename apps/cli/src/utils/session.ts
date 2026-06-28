import os from 'os';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import pc from 'picocolors';
import { getTopLevelDocument } from './firestore.js';

const DERIVO_DIR = path.join(os.homedir(), '.derivo');
const SESSION_FILE = path.join(DERIVO_DIR, 'session.json');

// Get machine specific key for encryption (so copying session.json to another machine won't work)
function getEncryptionKey(): Buffer {
  const machineId = os.hostname() + os.userInfo().username;
  return crypto.createHash('sha256').update(machineId).digest();
}

const ALGORITHM = 'aes-256-gcm';

export interface SessionData {
  token: string;
  uid: string;
  email: string;
  expiresAt?: number;
}

export function ensureDerivoDir() {
  if (!fs.existsSync(DERIVO_DIR)) {
    fs.mkdirSync(DERIVO_DIR, { recursive: true });
  }
  const cacheDir = path.join(DERIVO_DIR, 'cache');
  const logsDir = path.join(DERIVO_DIR, 'logs');
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
}

export function saveSession(data: SessionData) {
  ensureDerivoDir();

  const iv = crypto.randomBytes(16);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const jsonStr = JSON.stringify(data);
  let encrypted = cipher.update(jsonStr, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  const payload = {
    iv: iv.toString('hex'),
    encrypted,
    authTag,
  };

  fs.writeFileSync(SESSION_FILE, JSON.stringify(payload, null, 2), 'utf8');
}

export function getSession(): SessionData | null {
  if (!fs.existsSync(SESSION_FILE)) {
    return null;
  }

  try {
    const content = fs.readFileSync(SESSION_FILE, 'utf8');
    const payload = JSON.parse(content);

    if (!payload.iv || !payload.encrypted || !payload.authTag) {
      return null;
    }

    const key = getEncryptionKey();
    const iv = Buffer.from(payload.iv, 'hex');
    const authTag = Buffer.from(payload.authTag, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(payload.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted) as SessionData;
  } catch (err) {
    // If decryption fails (e.g. copied to another machine or corrupted), return null
    return null;
  }
}

export function clearSession() {
  if (fs.existsSync(SESSION_FILE)) {
    fs.unlinkSync(SESSION_FILE);
  }
}

/**
 * Robustly parse a subscription end date into epoch milliseconds.
 * Handles ISO strings, epoch numbers (seconds or ms), numeric strings, and
 * Firestore Timestamp-like objects ({ seconds } / { _seconds } / toMillis()).
 */
function parseEpochMs(value: any): number | null {
  if (value === null || value === undefined) return null;

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null;
    // Values below ~Sep 2001 in ms are almost certainly seconds.
    return value < 1e12 ? value * 1000 : value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return null;
    const asNumber = Number(trimmed);
    if (!Number.isNaN(asNumber)) return asNumber < 1e12 ? asNumber * 1000 : asNumber;
    const parsed = Date.parse(trimmed);
    return Number.isNaN(parsed) ? null : parsed;
  }

  if (typeof value === 'object') {
    if (typeof value.toMillis === 'function') {
      try {
        return value.toMillis();
      } catch {
        /* ignore */
      }
    }
    const seconds = value.seconds ?? value._seconds;
    if (seconds !== undefined) return Number(seconds) * 1000;
  }

  return null;
}

/** First defined end-date field among the common naming variants. */
function resolveEndDate(subData: any): number | null {
  const candidates = [
    subData.trialEndsAt,
    subData.trialEndAt,
    subData.trialEnd,
    subData.trialExpiresAt,
    subData.trialExpiry,
    subData.expiresAt,
    subData.currentPeriodEnd,
    subData.periodEnd,
    subData.endsAt,
    subData.endDate,
  ];
  for (const candidate of candidates) {
    const ms = parseEpochMs(candidate);
    if (ms !== null) return ms;
  }
  return null;
}

export async function verifySubscriptionActive(): Promise<boolean> {
  const session = getSession();
  if (!session) return true; // Let commands handle basic login checks

  try {
    // 1. Get subscription document
    const subDoc = await getTopLevelDocument(session.token, 'subscriptions', session.uid);
    let subData: any = null;

    if (subDoc.exists && subDoc.data) {
      subData = subDoc.data;
    } else if (subDoc.error) {
      // The read FAILED (expired token, denied by rules, server error, etc.).
      // We cannot verify the subscription — never lock a user out on a failure.
      if (process.env.DERIVO_DEBUG) {
        console.log(pc.dim('  [debug] subscription fetch error: ' + subDoc.error));
      }
      return true;
    } else {
      // Definitive 404 on subscriptions/{uid} — try the users/{uid} fallback.
      const userDoc = await getTopLevelDocument(session.token, 'users', session.uid);
      if (userDoc.exists && userDoc.data && userDoc.data.subscription) {
        subData = userDoc.data.subscription;
      } else if (userDoc.error) {
        if (process.env.DERIVO_DEBUG) {
          console.log(pc.dim('  [debug] users fetch error: ' + userDoc.error));
        }
        return true;
      }
      if (process.env.DERIVO_DEBUG) {
        console.log(pc.dim('  [debug] users doc: ' + JSON.stringify(userDoc.data ?? null)));
      }
    }

    if (process.env.DERIVO_DEBUG) {
      console.log(pc.dim('  [debug] subData: ' + JSON.stringify(subData)));
    }

    if (!subData) {
      console.log(pc.red('  ✗ Trial/Subscription expired. Purchase a subscription.'));
      return false;
    }

    const plan = String(subData.plan ?? subData.tier ?? '').toLowerCase();
    const status = String(subData.status ?? '').toLowerCase();

    const expiredStatuses = ['canceled', 'cancelled', 'expired', 'inactive', 'past_due', 'unpaid'];
    const isExpiredStatus = expiredStatuses.includes(status);
    const endMs = resolveEndDate(subData);
    const hasFutureEnd = endMs !== null && endMs > Date.now();

    // Paid plans: active (or trialing into a paid plan) grants access.
    if (plan === 'pro' || plan === 'enterprise' || plan === 'paid' || plan === 'team') {
      if ((status === 'active' || status === 'trialing') && !isExpiredStatus) return true;
      // Some billing models only set a period-end date.
      if (hasFutureEnd && !isExpiredStatus) return true;
    }

    // Trial: accept the common active-trial status values, and honour a valid
    // future end date as long as the subscription isn't explicitly cancelled.
    if (plan === 'trial' || plan === 'free_trial' || status.includes('trial')) {
      const activeTrialStatus =
        status === 'active' || status === 'trialing' || status === 'trial' || status === '';
      if (activeTrialStatus && hasFutureEnd) return true;
      // If no parseable end date exists but the trial is marked active, allow it
      // rather than locking out a legitimately active trial.
      if (activeTrialStatus && endMs === null) return true;
    }

    // Generic fallback: an explicitly active subscription with a future (or
    // unspecified) period end should not be treated as expired.
    if (status === 'active' && !isExpiredStatus && (hasFutureEnd || endMs === null)) {
      return true;
    }

    console.log(pc.red('  ✗ Trial/Subscription expired. Purchase a subscription.'));
    return false;
  } catch (e) {
    // If offline, let it pass (allow offline CLI checks where applicable, doctor handles offline test)
    return true;
  }
}
