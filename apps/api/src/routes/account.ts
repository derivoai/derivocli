/**
 * Account registration endpoint.
 *
 * Called by the web app immediately after Firebase creates a new auth user
 * (client-side). This endpoint:
 *   1. Verifies the Firebase ID token (so we know the uid and email are real).
 *   2. Runs all abuse checks (email fingerprint + IP limit).
 *   3. If the email was seen before and `INHERIT_TRIAL_ON_REREGISTER=true`,
 *      copies the prior trial/subscription state onto the new account so the
 *      free trial cannot be replayed by deleting and re-creating the account.
 *   4. Records the registration in the abuse-prevention collections.
 *
 * The subscription document written here is the authoritative starting point
 * for every new user. Clients never write their own subscription.
 */
import { Router } from 'express';
import { authOf, requireAuth, type AuthedRequest } from '../security/auth.js';
import { asyncHandler, Errors, ApiError } from '../security/errors.js';
import { getDb, isAdminInitialized } from '../firebase.js';
import { limiters, byIp } from '../security/rate-limit.js';
import { audit } from '../security/audit.js';
import { logger } from '../infra/logger.js';
import { loadConfig } from '../infra/config.js';
import {
  checkRegistrationAbuse,
  recordRegistration,
  hashEmail,
} from '../security/account-abuse.js';

export const accountRouter = Router();

function clientIp(req: AuthedRequest): string {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length > 0) return fwd.split(',')[0]!.trim();
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

// Strict rate limiter for account registration — 5 attempts per IP per hour.
const registrationLimiter = limiters.auth;

/**
 * POST /api/account/register
 *
 * Body: { firstName?: string, lastName?: string }
 * Auth: Bearer <Firebase ID token>  (user just signed up — token is fresh)
 *
 * Response:
 *   201 { status: 'new' | 'returning', subscription: {...} }
 *     or
 *   403 { error: string, code: 'registration_blocked' }
 *   429 { error: string, code: 'rate_limited' }
 */
accountRouter.post(
  '/register',
  registrationLimiter,
  requireAuth,
  asyncHandler<AuthedRequest>(async (req, res) => {
    const { uid, email } = authOf(req);
    const ip = clientIp(req);
    const { firstName, lastName } = (req.body ?? {}) as {
      firstName?: string;
      lastName?: string;
    };

    if (!email) throw Errors.badRequest('No email associated with this account.');

    // ── Abuse checks ──────────────────────────────────────────────────────
    const check = await checkRegistrationAbuse(uid, email, ip);

    if (!check.allowed) {
      if (check.reason === 'ip_limit_exceeded') {
        // 429 so the client knows to back off; message is generic.
        throw Errors.tooMany(check.message);
      }
      // email_blocked → 403
      throw new ApiError(403, 'registration_blocked', check.message);
    }

    // ── Build the subscription document ───────────────────────────────────
    const config = loadConfig();
    const now = new Date();
    const trialDurationMs = 3 * 24 * 60 * 60 * 1000; // 3-day trial

    let subscriptionDoc: Record<string, unknown>;
    let status: 'new' | 'returning' = 'new';

    if (
      config.inheritTrialOnReRegister &&
      check.priorSubscription &&
      check.priorSubscription.trialUsed
    ) {
      // Returning email — restore prior subscription state instead of granting
      // a fresh trial. The user's trial was already consumed.
      status = 'returning';
      const priorEndsAt = check.priorSubscription.trialEndsAt;
      subscriptionDoc = {
        uid,
        planId: check.priorSubscription.lastKnownPlanId ?? 'free',
        status: check.priorSubscription.lastKnownStatus ?? 'expired',
        trialUsed: true,
        trialEndsAt: priorEndsAt,
        // Preserve original trial end; do NOT extend.
        updatedAt: now.toISOString(),
        reRegisteredAt: now.toISOString(),
      };
      logger.info('account re-registration: trial inheritance applied', {
        uid,
        priorStatus: check.priorSubscription.lastKnownStatus,
      });
    } else {
      // Brand-new email — grant the default 3-day trial.
      const trialEndsAt = new Date(now.getTime() + trialDurationMs);
      subscriptionDoc = {
        uid,
        planId: 'trial',
        status: 'trialing',
        trialUsed: false,
        trialStartedAt: now.toISOString(),
        trialEndsAt: trialEndsAt.toISOString(),
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };
    }

    // ── Persist (Firestore) ───────────────────────────────────────────────
    if (isAdminInitialized()) {
      const db = getDb();
      const batch = db.batch();

      // Subscription document.
      batch.set(db.collection('subscriptions').doc(uid), subscriptionDoc, { merge: true });

      // User document — name + emailHash + role.
      const name =
        [firstName?.trim(), lastName?.trim()].filter(Boolean).join(' ') ||
        email.split('@')[0] ||
        'User';
      batch.set(
        db.collection('users').doc(uid),
        {
          name,
          firstName: firstName?.trim() ?? null,
          lastName: lastName?.trim() ?? null,
          email,
          emailHash: hashEmail(email),
          role:
            status === 'returning'
              ? subscriptionDoc.planId === 'trial'
                ? 'community'
                : 'community'
              : 'pro_trial',
          onboardingCompleted: false,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
        { merge: true },
      );

      await batch.commit();
      await audit('auth.login', uid, { event: 'account_registered', status, ip: '[redacted]' });
    }

    // ── Record in abuse-prevention collections ────────────────────────────
    await recordRegistration(uid, email, ip, {
      trialUsed: status === 'returning' ? true : false,
      trialEndsAt: (subscriptionDoc.trialEndsAt as string) ?? null,
      status: subscriptionDoc.status as string,
      planId: subscriptionDoc.planId as string,
    });

    res.status(201).json({
      status,
      message:
        status === 'returning'
          ? 'Account created. Your previous subscription status has been restored.'
          : 'Account created. Your free trial has started.',
      subscription: {
        planId: subscriptionDoc.planId,
        status: subscriptionDoc.status,
        trialUsed: subscriptionDoc.trialUsed,
        trialEndsAt: subscriptionDoc.trialEndsAt ?? null,
      },
    });
  }),
);

/**
 * GET /api/account/abuse-status
 *
 * Returns the current abuse status for the authenticated user's email.
 * Used by the dashboard to surface "your trial has been used" information.
 */
accountRouter.get(
  '/abuse-status',
  requireAuth,
  asyncHandler<AuthedRequest>(async (req, res) => {
    const { uid } = authOf(req);

    if (!isAdminInitialized()) {
      res.json({ blocked: false, trialUsed: false, registrationCount: 1 });
      return;
    }

    const userSnap = await getDb().collection('users').doc(uid).get();
    const emailHash = userSnap.data()?.emailHash as string | undefined;

    if (!emailHash) {
      res.json({ blocked: false, trialUsed: false, registrationCount: 1 });
      return;
    }

    const fingerSnap = await getDb().collection('emailFingerprints').doc(emailHash).get();
    if (!fingerSnap.exists) {
      res.json({ blocked: false, trialUsed: false, registrationCount: 1 });
      return;
    }

    const data = fingerSnap.data() as {
      blocked: boolean;
      trialUsed: boolean;
      registrationCount: number;
      trialEndsAt: string | null;
      lastKnownStatus: string | null;
      lastKnownPlanId: string | null;
    };

    res.json({
      blocked: data.blocked,
      trialUsed: data.trialUsed,
      registrationCount: data.registrationCount,
      trialEndsAt: data.trialEndsAt,
      lastKnownStatus: data.lastKnownStatus,
      lastKnownPlanId: data.lastKnownPlanId,
    });
  }),
);
