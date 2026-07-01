/**
 * CLI routes — the gate the CLI calls before premium commands. The verdict is
 * computed entirely server-side by the Subscription Service.
 *
 * CLI Login flow (state-based, no token in URL):
 *   1. CLI calls POST /api/cli/auth/init  → gets {state, expiresAt}
 *   2. CLI opens browser: https://derivo.in/cli-login?state=<state>
 *   3. Frontend authenticates user, calls POST /api/cli/auth/complete with {state, token}
 *   4. CLI polls GET /api/cli/auth/poll?state=<state> until token is ready
 *   5. Token returned once, then deleted
 */
import { Router } from 'express';
import { authOf, requireAuth, type AuthedRequest } from '../security/auth.js';
import { asyncHandler, Errors } from '../security/errors.js';
import { getSubscriptionState } from '../billing/subscription-service.js';
import { getDb, isAdminInitialized } from '../firebase.js';
import { limiters } from '../security/rate-limit.js';

export const cliRouter: Router = Router();

// In-memory store for pending CLI auth states.
// Each entry expires after 10 minutes.
interface PendingAuth {
  token?: string;
  uid?: string;
  email?: string;
  createdAt: number;
  completed: boolean;
}
const pendingAuths = new Map<string, PendingAuth>();

// Clean up expired states every minute
setInterval(() => {
  const now = Date.now();
  for (const [state, entry] of pendingAuths.entries()) {
    if (now - entry.createdAt > 10 * 60 * 1000) {
      pendingAuths.delete(state);
    }
  }
}, 60_000);

function randomState(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ── Step 1: CLI requests a state code ────────────────────────────────────────
cliRouter.post(
  '/auth/init',
  limiters.cliLogin,
  asyncHandler(async (_req, res) => {
    const state = randomState();
    pendingAuths.set(state, { createdAt: Date.now(), completed: false });
    res.json({
      state,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });
  }),
);

// ── Step 2: Frontend completes auth (called from browser after login) ─────────
cliRouter.post(
  '/auth/complete',
  requireAuth,
  asyncHandler<AuthedRequest>(async (req, res) => {
    const { uid, email } = authOf(req);
    const { state } = req.body ?? {};

    if (!state || typeof state !== 'string') throw Errors.badRequest('state is required');

    const entry = pendingAuths.get(state);
    if (!entry) throw Errors.badRequest('Invalid or expired state');
    if (Date.now() - entry.createdAt > 10 * 60 * 1000) {
      pendingAuths.delete(state);
      throw Errors.badRequest('State expired');
    }
    if (entry.completed) throw Errors.badRequest('State already used');

    // Get the Firebase token from the Authorization header (already verified by requireAuth)
    const token = req.headers.authorization!.slice('Bearer '.length).trim();

    entry.token = token;
    entry.uid = uid;
    entry.email = email;
    entry.completed = true;

    res.json({ success: true });
  }),
);

// ── Step 3: CLI polls for the token ──────────────────────────────────────────
cliRouter.get(
  '/auth/poll',
  limiters.cliLogin,
  asyncHandler(async (req, res) => {
    const state = req.query.state as string;
    if (!state) throw Errors.badRequest('state is required');

    const entry = pendingAuths.get(state);
    if (!entry) throw Errors.badRequest('Invalid or expired state');
    if (Date.now() - entry.createdAt > 10 * 60 * 1000) {
      pendingAuths.delete(state);
      throw Errors.badRequest('State expired');
    }

    if (!entry.completed || !entry.token) {
      res.json({ ready: false });
      return;
    }

    // Return token once then delete
    const { token, uid, email } = entry;
    pendingAuths.delete(state);

    res.json({ ready: true, token, uid, email });
  }),
);

// ── CLI verify (subscription check) ──────────────────────────────────────────
cliRouter.get(
  '/verify',
  requireAuth,
  asyncHandler<AuthedRequest>(async (req, res) => {
    const { uid } = authOf(req);

    const deviceId = req.headers['x-device-id'];
    if (isAdminInitialized() && typeof deviceId === 'string' && deviceId) {
      const snap = await getDb()
        .collection('users')
        .doc(uid)
        .collection('devices')
        .doc(deviceId)
        .get();
      if (snap.exists && snap.data()?.revoked === true) {
        res.json({
          authenticated: true,
          uid,
          active: false,
          plan: 'none',
          status: 'device_revoked',
          isTrial: false,
          remainingDays: 0,
          endsAt: null,
          reason: 'This device has been revoked. Run: derivo login',
        });
        return;
      }
    }

    const state = await getSubscriptionState(uid);
    res.json({
      authenticated: true,
      uid,
      active: state.active,
      plan: state.planId,
      status: state.status,
      isTrial: state.isTrial,
      remainingDays: state.remainingDays,
      endsAt: state.endsAt,
      reason: state.reason,
    });
  }),
);
