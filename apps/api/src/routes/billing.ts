/**
 * Billing & entitlement routes (mounted at /api):
 *   GET  /subscription   - backend-computed subscription state (display only)
 *   GET  /usage          - current usage vs limits
 *   GET  /limits         - plan limits
 *   GET  /features       - per-feature availability (canUse)
 *   POST /billing/webhook- provider webhook (signature-verified, replay-safe)
 *   POST /admin/*        - admin overrides (role-gated, audited)
 */
import { Router, type Request } from 'express';
import { authOf, requireAuth, type AuthedRequest } from '../security/auth.js';
import { requireRole } from '../security/authorize.js';
import { asyncHandler, Errors } from '../security/errors.js';
import { limiters } from '../security/rate-limit.js';
import { getPlan, type Feature } from '../billing/plans.js';
import { canUse, getSubscriptionState } from '../billing/subscription-service.js';
import { getUsageReport } from '../billing/usage-service.js';
import { getBillingProvider } from '../billing/providers/index.js';
import { applyBillingEvent } from '../billing/license-sync.js';
import {
  adjustLimits,
  extendTrial,
  grantPlan,
  grantTemporaryAccess,
  revokeSubscription,
} from '../billing/admin.js';
import { normalizePlanId } from '../billing/plans.js';

export const billingRouter: Router = Router();

const GATED_FEATURES: Feature[] = [
  'projects',
  'devices',
  'apiKeys',
  'plugins',
  'ai',
  'storage',
  'premiumCommands',
];

// ── Subscription state (display only) ────────────────────────────────────────
billingRouter.get(
  '/subscription',
  requireAuth,
  asyncHandler<AuthedRequest>(async (req, res) => {
    const { uid } = authOf(req);
    const state = await getSubscriptionState(uid);
    res.json(state);
  }),
);

// ── Usage ────────────────────────────────────────────────────────────────────
billingRouter.get(
  '/usage',
  requireAuth,
  asyncHandler<AuthedRequest>(async (req, res) => {
    const { uid } = authOf(req);
    res.json(await getUsageReport(uid));
  }),
);

// ── Limits ───────────────────────────────────────────────────────────────────
billingRouter.get(
  '/limits',
  requireAuth,
  asyncHandler<AuthedRequest>(async (req, res) => {
    const { uid } = authOf(req);
    const state = await getSubscriptionState(uid);
    res.json({ planId: state.planId, limits: getPlan(state.planId).limits });
  }),
);

// ── Features (canUse per feature) ────────────────────────────────────────────
billingRouter.get(
  '/features',
  requireAuth,
  asyncHandler<AuthedRequest>(async (req, res) => {
    const { uid } = authOf(req);
    const features: Record<string, unknown> = {};
    for (const f of GATED_FEATURES) {
      features[f] = await canUse(uid, f);
    }
    res.json({ features });
  }),
);

// ── Provider webhook (signature-verified, replay-safe) ───────────────────────
// No requireAuth: authenticity comes from the provider signature over the body.
billingRouter.post(
  '/billing/webhook',
  limiters.public,
  asyncHandler<Request>(async (req, res) => {
    const provider = getBillingProvider();
    const rawBody: Buffer =
      (req as Request & { rawBody?: Buffer }).rawBody ??
      Buffer.from(JSON.stringify(req.body ?? {}));
    const headers = req.headers as Record<string, unknown>;

    if (!provider.verifyWebhook(rawBody, headers)) {
      throw Errors.unauthorized('Invalid webhook signature');
    }

    let event;
    try {
      event = provider.parseWebhook(rawBody, headers);
    } catch {
      throw Errors.badRequest('Unparseable webhook payload');
    }

    const result = await applyBillingEvent(event);
    res.status(200).json({ received: true, ...result });
  }),
);

// ── Admin overrides (role-gated, audited) ────────────────────────────────────
const adminGuards = [requireAuth, requireRole('admin'), limiters.auth];

billingRouter.post(
  '/admin/grant-plan',
  ...adminGuards,
  asyncHandler<AuthedRequest>(async (req, res) => {
    const { uid } = authOf(req);
    const { targetUid, planId } = req.body ?? {};
    if (!targetUid || !planId) throw Errors.badRequest('targetUid and planId are required');
    await grantPlan(uid, String(targetUid), normalizePlanId(String(planId)));
    res.json({ success: true });
  }),
);

billingRouter.post(
  '/admin/extend-trial',
  ...adminGuards,
  asyncHandler<AuthedRequest>(async (req, res) => {
    const { uid } = authOf(req);
    const { targetUid, days } = req.body ?? {};
    if (!targetUid || typeof days !== 'number')
      throw Errors.badRequest('targetUid and days are required');
    await extendTrial(uid, String(targetUid), days);
    res.json({ success: true });
  }),
);

billingRouter.post(
  '/admin/revoke',
  ...adminGuards,
  asyncHandler<AuthedRequest>(async (req, res) => {
    const { uid } = authOf(req);
    const { targetUid } = req.body ?? {};
    if (!targetUid) throw Errors.badRequest('targetUid is required');
    await revokeSubscription(uid, String(targetUid));
    res.json({ success: true });
  }),
);

billingRouter.post(
  '/admin/adjust-limits',
  ...adminGuards,
  asyncHandler<AuthedRequest>(async (req, res) => {
    const { uid } = authOf(req);
    const { targetUid, limitOverrides } = req.body ?? {};
    if (!targetUid || typeof limitOverrides !== 'object') {
      throw Errors.badRequest('targetUid and limitOverrides are required');
    }
    await adjustLimits(uid, String(targetUid), limitOverrides);
    res.json({ success: true });
  }),
);

billingRouter.post(
  '/admin/temporary-access',
  ...adminGuards,
  asyncHandler<AuthedRequest>(async (req, res) => {
    const { uid } = authOf(req);
    const { targetUid, hours } = req.body ?? {};
    if (!targetUid || typeof hours !== 'number')
      throw Errors.badRequest('targetUid and hours are required');
    await grantTemporaryAccess(uid, String(targetUid), hours);
    res.json({ success: true });
  }),
);
