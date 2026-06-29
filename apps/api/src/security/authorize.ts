/**
 * Authorization — centralized access-control decisions made server-side.
 *
 * Covers: active-subscription gating, resource ownership, and roles. Feature
 * (limit) gating lives in `billing/feature-gate.ts`. Never trusts client-
 * supplied plan/ownership values.
 */
import type { Response, NextFunction } from 'express';
import { getDb, isAdminInitialized } from '../firebase.js';
import { type AuthedRequest, authOf } from './auth.js';
import { asyncHandler, Errors } from './errors.js';
import { getSubscriptionState } from '../billing/subscription-service.js';

export type Role = 'owner' | 'admin' | 'member' | 'readonly';

/** Gate a route behind an active (paid / trial / grace) subscription. */
export const requireActiveSubscription = asyncHandler<AuthedRequest>(async (req, _res, next) => {
  const { uid } = authOf(req);
  const state = await getSubscriptionState(uid);
  if (!state.active) {
    throw Errors.paymentRequired(state.reason || 'An active subscription is required');
  }
  next();
});

/**
 * Verify the authenticated user owns the project named in `:id`.
 * Returns 404 (not 403) for missing/foreign/soft-deleted projects to prevent
 * ID enumeration.
 */
export const requireProjectOwnership = asyncHandler<AuthedRequest>(async (req, _res, next) => {
  const { uid } = authOf(req);
  const projectId = req.params.id;
  if (!projectId) throw Errors.notFound('Project not found');

  if (!isAdminInitialized()) {
    next();
    return;
  }

  const db = getDb();
  const docRef = db.collection('users').doc(uid).collection('projects').doc(projectId);
  const snap = await docRef.get();

  if (!snap.exists) throw Errors.notFound('Project not found');
  const data = snap.data() as Record<string, unknown>;
  if (data.ownerUid && data.ownerUid !== uid) throw Errors.notFound('Project not found');
  if (data.deletedAt || data.status === 'deleted' || data.archived === true) {
    throw Errors.notFound('Project not found');
  }

  (req as AuthedRequest & { project?: Record<string, unknown> }).project = {
    id: projectId,
    ...data,
  };
  next();
});

/** Future-ready role gate (org membership). */
export function requireRole(...allowed: Role[]) {
  return (req: AuthedRequest, _res: Response, next: NextFunction): void => {
    const { claims } = authOf(req);
    const role = (claims?.role as Role) ?? 'owner';
    if (!allowed.includes(role)) {
      next(Errors.forbidden('Insufficient role'));
      return;
    }
    next();
  };
}
