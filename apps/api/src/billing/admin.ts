/**
 * Admin overrides — privileged subscription operations, all audit-logged.
 * Routes using these must be gated by `requireRole('admin')`.
 */
import { getDb, isAdminInitialized } from '../firebase.js';
import { audit } from '../security/audit.js';
import type { PlanId } from './plans.js';

async function setSubscription(uid: string, changes: Record<string, unknown>): Promise<void> {
  if (!isAdminInitialized()) return;
  const nowIso = new Date().toISOString();
  await getDb()
    .collection('subscriptions')
    .doc(uid)
    .set({ uid, updatedAt: nowIso, ...changes }, { merge: true });
}

export async function grantPlan(
  actorUid: string,
  targetUid: string,
  planId: PlanId,
): Promise<void> {
  await setSubscription(targetUid, { planId, status: 'active', currentPeriodEnd: null });
  await audit('permission.change', actorUid, { action: 'grant_plan', targetUid, planId });
}

export async function extendTrial(
  actorUid: string,
  targetUid: string,
  days: number,
): Promise<void> {
  const endsAt = new Date(Date.now() + days * 86_400_000).toISOString();
  await setSubscription(targetUid, { planId: 'trial', status: 'trialing', trialEndsAt: endsAt });
  await audit('permission.change', actorUid, { action: 'extend_trial', targetUid, days });
}

export async function revokeSubscription(actorUid: string, targetUid: string): Promise<void> {
  await setSubscription(targetUid, { planId: 'free', status: 'expired' });
  await audit('permission.change', actorUid, { action: 'revoke', targetUid });
}

export async function adjustLimits(
  actorUid: string,
  targetUid: string,
  limitOverrides: Record<string, number>,
): Promise<void> {
  await setSubscription(targetUid, { limitOverrides });
  await audit('permission.change', actorUid, {
    action: 'adjust_limits',
    targetUid,
    limitOverrides,
  });
}

export async function grantTemporaryAccess(
  actorUid: string,
  targetUid: string,
  hours: number,
): Promise<void> {
  const until = new Date(Date.now() + hours * 3_600_000).toISOString();
  await setSubscription(targetUid, { temporaryAccessUntil: until });
  await audit('permission.change', actorUid, { action: 'temporary_access', targetUid, hours });
}
