/**
 * CLI routes — the gate the CLI calls before premium commands. The verdict is
 * computed entirely server-side by the Subscription Service.
 */
import { Router } from 'express';
import { authOf, requireAuth, type AuthedRequest } from '../security/auth.js';
import { asyncHandler } from '../security/errors.js';
import { getSubscriptionState } from '../billing/subscription-service.js';

export const cliRouter: Router = Router();

cliRouter.get(
  '/verify',
  requireAuth,
  asyncHandler<AuthedRequest>(async (req, res) => {
    const { uid } = authOf(req);
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
