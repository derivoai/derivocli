/**
 * Authentication middleware — verifies Firebase ID tokens on every protected
 * request. Rejects missing, malformed, expired, invalid-signature, and REVOKED
 * tokens. The authenticated UID comes ONLY from the verified token — never from
 * the request body, query, or headers.
 */
import type { Request, Response, NextFunction } from 'express';
import { getAdmin, isAdminInitialized } from '../firebase.js';
import { asyncHandler, Errors } from './errors.js';

export interface AuthContext {
  uid: string;
  email?: string;
  /** Decoded claims (e.g. role) — present in real mode. */
  claims?: Record<string, unknown>;
}

export interface AuthedRequest extends Request {
  auth?: AuthContext;
}

function extractBearer(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  const token = header.slice('Bearer '.length).trim();
  return token.length > 0 ? token : null;
}

export const requireAuth = asyncHandler<AuthedRequest>(async (req, _res, next) => {
  const token = extractBearer(req);
  if (!token) throw Errors.unauthorized('Missing bearer token');

  // Mock mode (local dev only — the server refuses to start in mock mode when
  // DERIVO_REQUIRE_FIREBASE=1 / NODE_ENV=production).
  if (!isAdminInitialized()) {
    req.auth = { uid: 'mock-uid', email: 'mock-user@derivo.in' };
    next();
    return;
  }

  try {
    // checkRevoked=true rejects tokens from revoked sessions / disabled users.
    const decoded = await getAdmin().auth().verifyIdToken(token, true);
    req.auth = { uid: decoded.uid, email: decoded.email, claims: decoded };
    next();
  } catch (err: any) {
    // Distinguish expiry/revocation for a clearer (but non-leaky) message.
    const code = err?.code ?? '';
    if (code === 'auth/id-token-expired' || code === 'auth/session-cookie-expired') {
      throw Errors.unauthorized('Session expired');
    }
    if (code === 'auth/id-token-revoked' || code === 'auth/user-disabled') {
      throw Errors.unauthorized('Session revoked');
    }
    throw Errors.unauthorized('Invalid token');
  }
});

/** Helper for routes: the verified context, guaranteed present after requireAuth. */
export function authOf(req: AuthedRequest): AuthContext {
  if (!req.auth) throw Errors.unauthorized();
  return req.auth;
}
