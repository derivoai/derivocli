/**
 * Session routes — create a Derivo session (exchange verified auth for an
 * access+refresh pair), list, logout, logout-all, and refresh (token rotation
 * with reuse detection). Refresh is unauthenticated — the refresh token IS the
 * credential.
 */
import { Router } from 'express';
import { authOf, requireAuth, type AuthedRequest } from '../security/auth.js';
import { asyncHandler, Errors } from '../security/errors.js';
import { limiters } from '../security/rate-limit.js';
import { schemas, validateBody } from '../security/validation.js';
import {
  RefreshError,
  createSession,
  listSessions,
  logoutAll,
  refreshSession,
  revokeSession,
} from '../identity/sessions.js';

export const sessionsRouter: Router = Router();

// Create a session for the authenticated user (CLI calls this after login).
sessionsRouter.post(
  '/',
  requireAuth,
  limiters.cliLogin,
  validateBody(schemas.createSession),
  asyncHandler<AuthedRequest>(async (req, res) => {
    const { uid } = authOf(req);
    const { deviceId, deviceName } = req.body as { deviceId?: string; deviceName?: string };
    const created = await createSession(uid, { deviceId, deviceName });
    res.status(201).json({
      sessionId: created.session.id,
      accessToken: created.accessToken,
      refreshToken: created.refreshToken,
    });
  }),
);

sessionsRouter.get(
  '/',
  requireAuth,
  asyncHandler<AuthedRequest>(async (req, res) => {
    const { uid } = authOf(req);
    const currentSid = (req.headers['x-session-id'] as string) || '';
    const sessions = (await listSessions(uid)).map((s) => ({
      id: s.id,
      deviceId: s.deviceId ?? null,
      deviceName: s.deviceName ?? null,
      createdAt: s.createdAt,
      lastSeenAt: s.lastSeenAt,
      current: s.id === currentSid,
    }));
    res.json({ sessions });
  }),
);

sessionsRouter.post(
  '/logout',
  requireAuth,
  validateBody(schemas.sessionId),
  asyncHandler<AuthedRequest>(async (req, res) => {
    const { uid } = authOf(req);
    const ok = await revokeSession(uid, req.body.sessionId);
    if (!ok) throw Errors.notFound('Session not found');
    res.json({ success: true });
  }),
);

sessionsRouter.post(
  '/logout-all',
  requireAuth,
  validateBody(schemas.logoutAll),
  asyncHandler<AuthedRequest>(async (req, res) => {
    const { uid } = authOf(req);
    const count = await logoutAll(uid, req.body.exceptSessionId);
    res.json({ success: true, revoked: count });
  }),
);

// Token rotation. No requireAuth — the refresh token authenticates the request.
sessionsRouter.post(
  '/refresh',
  limiters.auth,
  validateBody(schemas.refresh),
  asyncHandler(async (req, res) => {
    try {
      const result = await refreshSession(req.body.refreshToken);
      res.json({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        sessionId: result.sessionId,
      });
    } catch (err) {
      if (err instanceof RefreshError) {
        // Reuse → 401 with a distinct code so the client forces re-login.
        throw err.code === 'reuse_detected'
          ? Errors.unauthorized('Session revoked (token reuse detected)')
          : Errors.unauthorized(err.message);
      }
      throw err;
    }
  }),
);
