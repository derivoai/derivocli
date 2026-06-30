/**
 * Account-creation abuse prevention.
 *
 * Two independent layers:
 *
 * 1. EMAIL FINGERPRINT (permanent, Firestore-backed)
 *    Every email address is normalised and hashed before it is stored, so no
 *    PII is persisted in the abuse collection. When a user registers:
 *      a) Their email hash is recorded under `emailFingerprints/{hash}`.
 *      b) If that hash already exists (i.e. the address was seen before, even
 *         if the old Firebase account was deleted), we read the previously
 *         stored trial/subscription state and copy it back onto the new
 *         account's subscription document so the free trial cannot be replayed.
 *      c) The mapping also stores {uid → emailHash} so a later lookup can
 *         resolve "has this uid's email been registered before".
 *
 * 2. IP ACCOUNT COUNT (configurable window, Firestore-backed)
 *    Each registration records the client IP in `ipRegistrations/{ip_hash}`.
 *    If the number of distinct accounts registered from that IP within the
 *    configured window (MAX_ACCOUNTS_PER_IP_WINDOW_DAYS) reaches the limit
 *    (MAX_ACCOUNTS_PER_IP), the registration is blocked with 429. Both values
 *    are read from config so they can be changed via env vars without a redeploy.
 *    Set MAX_ACCOUNTS_PER_IP=0 to disable the IP check entirely.
 *
 * Collections used (backend-only, Admin SDK — never client-reachable):
 *   emailFingerprints/{emailHash}   → { uid, emailHash, createdAt, trialUsed,
 *                                       trialEndsAt, subscriptionStatus, blocked }
 *   ipRegistrations/{ipHash}/accounts/{uid} → { uid, ip, registeredAt }
 */
import crypto from 'crypto';
import { getDb, isAdminInitialized } from '../firebase.js';
import { loadConfig } from '../infra/config.js';
import { logger } from '../infra/logger.js';
import { audit } from './audit.js';

// ── Types ────────────────────────────────────────────────────────────────────

export interface EmailFingerprintRecord {
  uid: string;
  emailHash: string;
  createdAt: string;
  updatedAt: string;
  /** How many times this email has been used to register. */
  registrationCount: number;
  /** True once a trial has been consumed via this email. */
  trialUsed: boolean;
  trialEndsAt: string | null;
  /** The status copied from the last known subscription for this email. */
  lastKnownStatus: string | null;
  lastKnownPlanId: string | null;
  /** Manual block set by an admin. */
  blocked: boolean;
  blockReason: string | null;
}

export interface RegistrationCheckResult {
  /** Whether the registration should be allowed to proceed. */
  allowed: boolean;
  /** Machine-readable reason code. */
  reason: 'ok' | 'email_blocked' | 'ip_limit_exceeded' | 'error_fail_open'; // store error — fail open
  /** Human-readable message (never leaks raw data). */
  message: string;
  /**
   * When allowed=true and the email was seen before, this carries the previous
   * subscription state so it can be merged onto the new account. null when the
   * email is brand-new or Firebase Admin is unavailable.
   */
  priorSubscription: {
    trialUsed: boolean;
    trialEndsAt: string | null;
    lastKnownStatus: string | null;
    lastKnownPlanId: string | null;
  } | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** One-way hash of a normalised email. Hex, 64 chars. */
export function hashEmail(email: string): string {
  const normalised = email.trim().toLowerCase();
  return crypto.createHash('sha256').update(normalised).digest('hex');
}

/** One-way hash of an IP address (IPv4 or IPv6). */
function hashIp(ip: string): string {
  return crypto.createHash('sha256').update(ip.trim()).digest('hex');
}

function ipCol() {
  return getDb().collection('ipRegistrations');
}
function emailCol() {
  return getDb().collection('emailFingerprints');
}

// ── Core check ───────────────────────────────────────────────────────────────

/**
 * Run all abuse checks for a new account registration.
 *
 * Call this AFTER Firebase has created the auth user (so uid is known) but
 * BEFORE writing the subscription document, so the prior trial state can be
 * applied to the subscription that is about to be created.
 *
 * Fails OPEN on store errors — a Firestore outage must never prevent a valid
 * user from signing up.
 */
export async function checkRegistrationAbuse(
  uid: string,
  email: string,
  ip: string,
): Promise<RegistrationCheckResult> {
  if (!isAdminInitialized()) {
    // Mock / dev mode — skip all checks.
    return { allowed: true, reason: 'ok', message: 'ok', priorSubscription: null };
  }

  const config = loadConfig();

  try {
    const emailHash = hashEmail(email);

    // ── 1. Email fingerprint check ──────────────────────────────────────────
    const emailDoc = await emailCol().doc(emailHash).get();
    if (emailDoc.exists) {
      const data = emailDoc.data() as EmailFingerprintRecord;
      if (data.blocked) {
        logger.warn('registration blocked: email fingerprint blocked', { uid, emailHash });
        await audit('auth.login', uid, {
          event: 'registration_blocked_email',
          reason: data.blockReason,
        });
        return {
          allowed: false,
          reason: 'email_blocked',
          message: 'This account is not eligible for a new registration.',
          priorSubscription: null,
        };
      }

      // Allowed but the email was seen before — return prior trial state.
      const prior = {
        trialUsed: data.trialUsed,
        trialEndsAt: data.trialEndsAt ?? null,
        lastKnownStatus: data.lastKnownStatus ?? null,
        lastKnownPlanId: data.lastKnownPlanId ?? null,
      };

      // ── 2. IP check ─────────────────────────────────────────────────────
      const ipBlocked = config.maxAccountsPerIp > 0 ? await checkIpLimit(uid, ip, config) : false;

      if (ipBlocked) {
        logger.warn('registration blocked: ip limit exceeded', { uid, ip: '[redacted]' });
        await audit('auth.login', uid, { event: 'registration_blocked_ip' });
        return {
          allowed: false,
          reason: 'ip_limit_exceeded',
          message:
            'Too many accounts have been created from your location. Please contact support.',
          priorSubscription: null,
        };
      }

      logger.info('re-registration: returning prior subscription state', {
        uid,
        trialUsed: prior.trialUsed,
        lastKnownStatus: prior.lastKnownStatus,
      });
      return { allowed: true, reason: 'ok', message: 'ok', priorSubscription: prior };
    }

    // ── 2. IP check (first-time email) ─────────────────────────────────────
    if (config.maxAccountsPerIp > 0) {
      const ipBlocked = await checkIpLimit(uid, ip, config);
      if (ipBlocked) {
        logger.warn('registration blocked: ip limit exceeded (new email)', { uid });
        await audit('auth.login', uid, { event: 'registration_blocked_ip' });
        return {
          allowed: false,
          reason: 'ip_limit_exceeded',
          message:
            'Too many accounts have been created from your location. Please contact support.',
          priorSubscription: null,
        };
      }
    }

    return { allowed: true, reason: 'ok', message: 'ok', priorSubscription: null };
  } catch (err) {
    logger.error('account-abuse check failed (fail open)', {
      uid,
      error: err instanceof Error ? err.message : String(err),
    });
    return {
      allowed: true,
      reason: 'error_fail_open',
      message: 'ok',
      priorSubscription: null,
    };
  }
}

/** Returns true if the IP has hit the registration limit within the window. */
async function checkIpLimit(
  uid: string,
  ip: string,
  config: ReturnType<typeof loadConfig>,
): Promise<boolean> {
  if (!ip || ip === 'unknown') return false;

  const ipHash = hashIp(ip);
  const windowMs = config.maxAccountsPerIpWindowDays * 24 * 60 * 60 * 1000;
  const cutoff = new Date(Date.now() - windowMs).toISOString();

  const snap = await ipCol()
    .doc(ipHash)
    .collection('accounts')
    .where('registeredAt', '>=', cutoff)
    .get();

  // Exclude the current uid in case this is a retry.
  const count = snap.docs.filter((d) => d.id !== uid).length;
  return count >= config.maxAccountsPerIp;
}

// ── Post-registration recording ──────────────────────────────────────────────

/**
 * Record a completed registration in both the email fingerprint and IP
 * collections. Call this AFTER the subscription document has been written.
 *
 * `subscriptionSnapshot` is the subscription document as just written — it is
 * stored denormalised so a future re-registration can inherit the trial state.
 */
export async function recordRegistration(
  uid: string,
  email: string,
  ip: string,
  subscriptionSnapshot: {
    trialUsed: boolean;
    trialEndsAt: string | null;
    status: string | null;
    planId: string | null;
  },
): Promise<void> {
  if (!isAdminInitialized()) return;

  const emailHash = hashEmail(email);
  const now = new Date().toISOString();

  try {
    const db = getDb();
    const emailRef = emailCol().doc(emailHash);
    const existing = await emailRef.get();

    if (existing.exists) {
      await emailRef.update({
        uid,
        updatedAt: now,
        registrationCount: (existing.data() as EmailFingerprintRecord).registrationCount + 1,
        trialUsed: subscriptionSnapshot.trialUsed,
        trialEndsAt: subscriptionSnapshot.trialEndsAt,
        lastKnownStatus: subscriptionSnapshot.status,
        lastKnownPlanId: subscriptionSnapshot.planId,
      });
    } else {
      const record: EmailFingerprintRecord = {
        uid,
        emailHash,
        createdAt: now,
        updatedAt: now,
        registrationCount: 1,
        trialUsed: subscriptionSnapshot.trialUsed,
        trialEndsAt: subscriptionSnapshot.trialEndsAt,
        lastKnownStatus: subscriptionSnapshot.status,
        lastKnownPlanId: subscriptionSnapshot.planId,
        blocked: false,
        blockReason: null,
      };
      await emailRef.set(record);
    }

    // IP registration record.
    if (ip && ip !== 'unknown') {
      const ipHash = hashIp(ip);
      await ipCol().doc(ipHash).collection('accounts').doc(uid).set({
        uid,
        registeredAt: now,
      });
    }

    // Bi-directional index: uid → emailHash (so subscription update jobs can
    // find the fingerprint without knowing the email).
    await db.collection('users').doc(uid).set({ emailHash, updatedAt: now }, { merge: true });
  } catch (err) {
    // Recording is best-effort — never break registration flow.
    logger.error('recordRegistration failed', {
      uid,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Sync the email fingerprint with the latest subscription state so re-
 * registration always sees the most current trial/status data.
 * Called by the billing event handler whenever a subscription changes.
 */
export async function syncEmailFingerprint(
  uid: string,
  subscription: {
    trialUsed: boolean;
    trialEndsAt: string | null;
    status: string | null;
    planId: string | null;
  },
): Promise<void> {
  if (!isAdminInitialized()) return;
  try {
    const userSnap = await getDb().collection('users').doc(uid).get();
    const emailHash = userSnap.data()?.emailHash as string | undefined;
    if (!emailHash) return;
    await emailCol().doc(emailHash).update({
      uid,
      updatedAt: new Date().toISOString(),
      trialUsed: subscription.trialUsed,
      trialEndsAt: subscription.trialEndsAt,
      lastKnownStatus: subscription.status,
      lastKnownPlanId: subscription.planId,
    });
  } catch (err) {
    logger.warn('syncEmailFingerprint failed', {
      uid,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

// ── Admin helpers ─────────────────────────────────────────────────────────────

/** Block an email address from ever registering again. Admin use only. */
export async function blockEmail(email: string, reason: string): Promise<void> {
  if (!isAdminInitialized()) throw new Error('Admin SDK not initialized');
  const emailHash = hashEmail(email);
  const ref = emailCol().doc(emailHash);
  const snap = await ref.get();
  const now = new Date().toISOString();
  if (snap.exists) {
    await ref.update({ blocked: true, blockReason: reason, updatedAt: now });
  } else {
    await ref.set({
      uid: '',
      emailHash,
      createdAt: now,
      updatedAt: now,
      registrationCount: 0,
      trialUsed: false,
      trialEndsAt: null,
      lastKnownStatus: null,
      lastKnownPlanId: null,
      blocked: true,
      blockReason: reason,
    });
  }
}

/** Unblock a previously blocked email address. Admin use only. */
export async function unblockEmail(email: string): Promise<void> {
  if (!isAdminInitialized()) throw new Error('Admin SDK not initialized');
  const emailHash = hashEmail(email);
  await emailCol().doc(emailHash).update({
    blocked: false,
    blockReason: null,
    updatedAt: new Date().toISOString(),
  });
}
