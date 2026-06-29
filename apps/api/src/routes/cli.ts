/**
 * CLI routes — the gate the CLI calls before premium commands. The verdict is
 * computed entirely server-side by the Subscription Service.
 */
import { Router } from 'express';
import { authOf, requireAuth, type AuthedRequest } from '../security/auth.js';
import { asyncHandler } from '../security/errors.js';
import { getSubscriptionState } from '../billing/subscription-service.js';
import { getDb, isAdminInitialized } from '../firebase.js';

export const cliRouter: Router = Router();

cliRouter.get(
  '/verify',
  requireAuth,
  asyncHandler<AuthedRequest>(async (req, res) => {
    const { uid } = authOf(req);

    // Device-level revocation: if the calling device was revoked from the
    // dashboard, the CLI loses access immediately (backend-enforced).
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
