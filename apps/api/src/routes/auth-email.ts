/**
 * Transactional auth-email endpoints.
 *
 * Every endpoint generates Firebase Admin SDK action links, rewrites them to
 * auth.derivo.in/action, and hands the HTML template + link to the configured
 * email provider (Resend by default). Firebase's built-in email delivery is
 * never used.
 *
 * Links are never returned to the client in production.
 */
import { Router } from 'express';
import { authOf, requireAuth, type AuthedRequest } from '../security/auth.js';
import { asyncHandler, Errors } from '../security/errors.js';
import { isAdminInitialized } from '../firebase.js';
import { limiters } from '../security/rate-limit.js';
import { getEmailActionService } from '../identity/email/index.js';

export const authEmailRouter = Router();

/**
 * POST /api/auth/email/send-verification
 * Send a verification email for the authenticated user.
 * UID/email sourced only from the verified token.
 */
authEmailRouter.post(
  '/send-verification',
  limiters.auth,
  requireAuth,
  asyncHandler<AuthedRequest>(async (req, res) => {
    const { email } = authOf(req);
    if (!isAdminInitialized()) {
      res.json({ sent: false, provider: 'none', mock: true });
      return;
    }
    if (!email) throw Errors.badRequest('No email associated with this account.');
    const result = await getEmailActionService().sendVerification(email);
    res.json(result);
  }),
);

/**
 * POST /api/auth/email/send-password-reset
 * Send a password-reset email. Public + rate-limited.
 * Always returns 200 to prevent account enumeration.
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
        await getEmailActionService().sendPasswordReset(email);
      } catch {
        // Swallow — never reveal whether the account exists.
      }
    }
    res.json({ ok: true });
  }),
);

/**
 * POST /api/auth/email/send-recover
 * Notify a user that their email address can be recovered.
 * Requires auth (the currently-signed-in user for that account).
 */
authEmailRouter.post(
  '/send-recover',
  limiters.auth,
  requireAuth,
  asyncHandler<AuthedRequest>(async (req, res) => {
    const { email } = authOf(req);
    if (!isAdminInitialized()) {
      res.json({ sent: false, provider: 'none', mock: true });
      return;
    }
    if (!email) throw Errors.badRequest('No email associated with this account.');
    const { restoredEmail } = (req.body ?? {}) as { restoredEmail?: string };
    const result = await getEmailActionService().sendRecoverEmail(email, restoredEmail || email);
    res.json(result);
  }),
);

export default authEmailRouter;
