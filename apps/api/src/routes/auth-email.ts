/**
 * Transactional auth-email endpoints. These generate Firebase action links via
 * the Admin SDK (the prepared replacement for client-side sendEmailVerification)
 * and hand them to the configured email provider for delivery.
 *
 * Delivery is a no-op until a provider is configured, so these endpoints are
 * safe to call but will not yet send mail. Links are never returned to clients
 * in production.
 */
import { Router } from 'express';
import { authOf, requireAuth, type AuthedRequest } from '../security/auth.js';
import { asyncHandler, Errors } from '../security/errors.js';
import { isAdminInitialized } from '../firebase.js';
import { limiters } from '../security/rate-limit.js';
import { getEmailActionService } from '../identity/email/index.js';

export const authEmailRouter = Router();

/**
 * Send (generate) an email-verification link for the authenticated user.
 * UID/email come only from the verified token, never the request body.
 */
authEmailRouter.post(
  '/send-verification',
  limiters.auth,
  requireAuth,
  asyncHandler<AuthedRequest>(async (req, res) => {
    const { email } = authOf(req);
    if (!isAdminInitialized()) {
      // Mock mode: nothing to generate. Report a no-op so callers don't break.
      res.json({ sent: false, provider: 'none', mock: true });
      return;
    }
    if (!email) throw Errors.badRequest('No email associated with this account.');

    const result = await getEmailActionService().send('verifyEmail', email);
    res.json(result);
  }),
);

/**
 * Send (generate) a password-reset link for an email address. Public + rate
 * limited. Always returns a generic success to avoid account enumeration.
 */
authEmailRouter.post(
  '/send-password-reset',
  limiters.auth,
  asyncHandler(async (req, res) => {
    const { email } = (req.body ?? {}) as { email?: string };
    if (!email || typeof email !== 'string') {
      throw Errors.badRequest('A valid email address is required.');
    }

    if (isAdminInitialized()) {
      try {
        await getEmailActionService().send('resetPassword', email);
      } catch {
        // Swallow — never reveal whether the account exists.
      }
    }
    // Enumeration-safe: identical response regardless of account existence.
    res.json({ ok: true });
  }),
);

export default authEmailRouter;
