/**
 * Subscription Service — the single source of truth for subscription, trial,
 * grace-period, and feature-gate decisions. Every backend route consumes this;
 * subscription logic is never duplicated.
 */
import { getDb, isAdminInitialized } from '../firebase.js';
import { getPlan, isUnlimited, normalizePlanId, type Feature, type PlanId } from './plans.js';
import type { SubscriptionRecord, SubscriptionStatus } from './types.js';
import { getUsage } from './usage-service.js';

export interface SubscriptionState {
  active: boolean;
  planId: PlanId;
  planLabel: string;
  status: SubscriptionStatus;
  isTrial: boolean;
  inGrace: boolean;
  /** ISO of the relevant end date (trial or period), if any. */
  endsAt: string | null;
  renewalDate: string | null;
  remainingDays: number;
  remainingHours: number;
  reason: string;
}

export interface FeatureDecision {
  feature: Feature;
  allowed: boolean;
  limit: number; // -1 = unlimited
  used: number;
  remaining: number; // -1 = unlimited
  reason: string;
}

function toMs(value: unknown): number | null {
  if (!value) return null;
  if (typeof value === 'number') return value < 1e12 ? value * 1000 : value;
  if (typeof value === 'string') {
    const t = Date.parse(value);
    return Number.isNaN(t) ? null : t;
  }
  if (typeof value === 'object') {
    const v = value as { toMillis?: () => number; seconds?: number; _seconds?: number };
    if (typeof v.toMillis === 'function') {
      try {
        return v.toMillis();
      } catch {
        /* ignore */
      }
    }
    const s = v.seconds ?? v._seconds;
    if (s !== undefined) return Number(s) * 1000;
  }
  return null;
}

/** Pure evaluation of a stored record. Exported for unit tests. */
export function evaluateSubscription(record: SubscriptionRecord | null): SubscriptionState {
  const now = Date.now();

  const build = (
    planId: PlanId,
    status: SubscriptionStatus,
    active: boolean,
    endMs: number | null,
    reason: string,
    opts: { isTrial?: boolean; inGrace?: boolean } = {},
  ): SubscriptionState => {
    const plan = getPlan(planId);
    const remainingMs = endMs && endMs > now ? endMs - now : 0;
    return {
      active,
      planId,
      planLabel: plan.label,
      status,
      isTrial: opts.isTrial ?? false,
      inGrace: opts.inGrace ?? false,
      endsAt: endMs ? new Date(endMs).toISOString() : null,
      renewalDate: !opts.isTrial && endMs ? new Date(endMs).toISOString() : null,
      remainingDays: Math.floor(remainingMs / 86_400_000),
      remainingHours: Math.floor(remainingMs / 3_600_000),
      reason,
    };
  };

  if (!record) return build('free', 'none', false, null, 'No subscription');

  const planId = normalizePlanId(record.planId);
  const status = record.status;

  // Admin temporary access overrides everything while valid.
  const tempMs = toMs(record.temporaryAccessUntil);
  if (tempMs && tempMs > now) {
    return build(
      planId === 'free' ? 'pro' : planId,
      'active',
      true,
      tempMs,
      'Temporary admin access',
    );
  }

  const periodEnd = toMs(record.currentPeriodEnd);
  const trialEnd = toMs(record.trialEndsAt);
  const graceEnd = toMs(record.gracePeriodEndsAt);

  switch (status) {
    case 'active':
      if (periodEnd && periodEnd <= now) {
        return build(planId, 'expired', false, periodEnd, 'Subscription period ended');
      }
      return build(planId, 'active', true, periodEnd, 'Active subscription');

    case 'trialing': {
      if (trialEnd && trialEnd <= now) {
        return build('free', 'expired', false, trialEnd, 'Trial expired', { isTrial: true });
      }
      return build(
        planId === 'free' ? 'trial' : planId,
        'trialing',
        true,
        trialEnd,
        'Active trial',
        {
          isTrial: true,
        },
      );
    }

    case 'cancelled':
      // Cancelled but may still be within the paid period.
      if (periodEnd && periodEnd > now) {
        return build(planId, 'cancelled', true, periodEnd, 'Cancelled — active until period end');
      }
      return build('free', 'expired', false, periodEnd, 'Subscription cancelled');

    case 'grace':
      if (graceEnd && graceEnd > now) {
        return build(planId, 'grace', true, graceEnd, 'Payment failed — grace period', {
          inGrace: true,
        });
      }
      return build('free', 'expired', false, graceEnd, 'Grace period ended');

    case 'expired':
      return build('free', 'expired', false, periodEnd ?? trialEnd, 'Subscription expired');

    default:
      // Fall back to date-based inference for legacy/loose records.
      if (trialEnd && trialEnd > now)
        return build('trial', 'trialing', true, trialEnd, 'Active trial', { isTrial: true });
      if (periodEnd && periodEnd > now)
        return build(planId, 'active', true, periodEnd, 'Active subscription');
      return build('free', 'none', false, null, 'No active subscription');
  }
}

const EXPIRED_RAW_STATUSES = ['expired', 'inactive', 'past_due', 'unpaid', 'refunded'];

/**
 * Normalize a loosely-shaped subscription document (legacy or partial) into a
 * clean `SubscriptionRecord` with a canonical status, so the evaluator behaves
 * correctly even for older docs (e.g. a trial stored as status:"active").
 */
export function looseDocToRecord(
  uid: string,
  doc: Record<string, unknown> | null,
): SubscriptionRecord | null {
  if (!doc) return null;
  const planId = normalizePlanId(String(doc.planId ?? doc.plan ?? doc.tier ?? doc.role ?? ''));
  const raw = String(doc.status ?? '').toLowerCase();
  const trialEndRaw =
    doc.trialEndsAt ?? doc.trialEndAt ?? doc.trialEnd ?? doc.trialExpiresAt ?? null;
  const periodEndRaw =
    doc.currentPeriodEnd ?? doc.periodEnd ?? doc.expiresAt ?? doc.endsAt ?? doc.endDate ?? null;
  const hasTrialEnd = trialEndRaw != null;

  let status: SubscriptionStatus;
  if (EXPIRED_RAW_STATUSES.includes(raw)) status = 'expired';
  else if (raw === 'cancelled' || raw === 'canceled') status = 'cancelled';
  else if (raw === 'grace') status = 'grace';
  else if (raw === 'trialing' || raw === 'trial') status = 'trialing';
  else if (raw === 'active' || raw === '')
    status = planId === 'trial' || (hasTrialEnd && !periodEndRaw) ? 'trialing' : 'active';
  else status = 'active';

  return {
    uid,
    planId,
    status,
    currentPeriodEnd: (periodEndRaw as string) ?? null,
    trialEndsAt: (trialEndRaw as string) ?? null,
    gracePeriodEndsAt: (doc.gracePeriodEndsAt as string) ?? null,
    temporaryAccessUntil: (doc.temporaryAccessUntil as string) ?? null,
    limitOverrides: (doc.limitOverrides as Record<string, number>) ?? null,
    cancelledAt: (doc.cancelledAt as string) ?? null,
    provider: doc.provider as string | undefined,
  };
}

/** Load + evaluate a user's subscription. */
export async function getSubscriptionState(uid: string): Promise<SubscriptionState> {
  if (!isAdminInitialized()) {
    // Dev mock mode only (production refuses to start in mock mode).
    return {
      active: true,
      planId: 'pro',
      planLabel: 'Pro (mock)',
      status: 'active',
      isTrial: false,
      inGrace: false,
      endsAt: null,
      renewalDate: null,
      remainingDays: 0,
      remainingHours: 0,
      reason: 'Mock mode',
    };
  }

  let rawDoc: Record<string, unknown> | null = null;
  const snap = await getDb().collection('subscriptions').doc(uid).get();
  if (snap.exists) {
    rawDoc = snap.data() as Record<string, unknown>;
  } else {
    const userDoc = await getDb().collection('users').doc(uid).get();
    if (userDoc.exists) {
      const data = (userDoc.data() || {}) as Record<string, unknown>;
      rawDoc =
        (data.subscription as Record<string, unknown>) ??
        (data.role ? { plan: data.role, status: 'active' } : null);
    }
  }
  return evaluateSubscription(looseDocToRecord(uid, rawDoc));
}

/** Limit for a feature on the user's effective plan (with admin overrides). */
export async function getLimit(uid: string, feature: Feature): Promise<number> {
  const state = await getSubscriptionState(uid);
  const plan = getPlan(state.planId);
  const override = await readLimitOverride(uid, feature);
  return override ?? plan.limits[feature];
}

async function readLimitOverride(uid: string, feature: Feature): Promise<number | null> {
  if (!isAdminInitialized()) return null;
  const snap = await getDb().collection('subscriptions').doc(uid).get();
  const overrides = (snap.data()?.limitOverrides ?? {}) as Record<string, number>;
  return typeof overrides[feature] === 'number' ? overrides[feature]! : null;
}

/**
 * Central feature gate. Callers use this instead of `if (plan === 'pro')`.
 * Combines subscription state + plan limits + current usage.
 */
export async function canUse(uid: string, feature: Feature): Promise<FeatureDecision> {
  const state = await getSubscriptionState(uid);
  const plan = getPlan(state.planId);
  const limit = (await readLimitOverride(uid, feature)) ?? plan.limits[feature];

  // A feature with a positive limit is usable on any plan up to that limit.
  // A feature with limit 0 is premium-only (free plan can't use it at all).
  const used = await getUsage(uid, feature);

  if (isUnlimited(limit)) {
    return { feature, allowed: true, limit, used, remaining: -1, reason: 'Unlimited' };
  }
  if (limit <= 0) {
    return {
      feature,
      allowed: false,
      limit,
      used,
      remaining: 0,
      reason: state.active ? 'Not included in your plan' : 'Requires an active subscription',
    };
  }
  const remaining = Math.max(0, limit - used);
  return {
    feature,
    allowed: used < limit,
    limit,
    used,
    remaining,
    reason: used < limit ? 'Within limit' : `Limit reached (${limit})`,
  };
}
