/**
 * Login history route — returns the authenticated user's recent identity
 * events (login, logout, refresh, device registration, token revocation).
 */
import { Router } from 'express';
import { authOf, requireAuth, type AuthedRequest } from '../security/auth.js';
import { asyncHandler } from '../security/errors.js';
import { listLoginHistory } from '../identity/sessions.js';

export const loginHistoryRouter: Router = Router();

loginHistoryRouter.get(
  '/',
  requireAuth,
  asyncHandler<AuthedRequest>(async (req, res) => {
    const { uid } = authOf(req);
    res.json({ history: await listLoginHistory(uid) });
  }),
);
