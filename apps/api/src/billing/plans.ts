/**
 * Plan catalog & limits — the single configurable source of plan entitlements.
 *
 * Add or change plans here only. Feature gates and the subscription service
 * read from this catalog; business logic never hardcodes a plan name.
 */

export type PlanId = 'free' | 'trial' | 'pro' | 'enterprise';

/** Features that can be gated. */
export type Feature =
  'projects' | 'devices' | 'apiKeys' | 'plugins' | 'ai' | 'storage' | 'premiumCommands';

/** -1 means unlimited. */
export type Limit = number;

export interface PlanDefinition {
  id: PlanId;
  label: string;
  /** Whether this plan grants premium (gated) capabilities. */
  premium: boolean;
  limits: Record<Feature, Limit>;
}

const UNLIMITED = -1;

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: 'free',
    label: 'Free',
    premium: false,
    limits: {
      projects: 3,
      devices: 2,
      apiKeys: 1,
      plugins: 5,
      ai: 0,
      storage: 100, // MB
      premiumCommands: 0,
    },
  },
  trial: {
    id: 'trial',
    label: 'Pro Trial',
    premium: true,
    limits: {
      projects: UNLIMITED,
      devices: UNLIMITED,
      apiKeys: 10,
      plugins: UNLIMITED,
      ai: 1000,
      storage: 5_000,
      premiumCommands: UNLIMITED,
    },
  },
  pro: {
    id: 'pro',
    label: 'Pro',
    premium: true,
    limits: {
      projects: UNLIMITED,
      devices: UNLIMITED,
      apiKeys: 50,
      plugins: UNLIMITED,
      ai: 10_000,
      storage: 50_000,
      premiumCommands: UNLIMITED,
    },
  },
  enterprise: {
    id: 'enterprise',
    label: 'Enterprise',
    premium: true,
    limits: {
      projects: UNLIMITED,
      devices: UNLIMITED,
      apiKeys: UNLIMITED,
      plugins: UNLIMITED,
      ai: UNLIMITED,
      storage: UNLIMITED,
      premiumCommands: UNLIMITED,
    },
  },
};

export function getPlan(planId: PlanId): PlanDefinition {
  return PLANS[planId] ?? PLANS.free;
}

/** Normalize an arbitrary plan/tier/role string to a known PlanId. */
export function normalizePlanId(value: string | null | undefined): PlanId {
  const v = String(value ?? '').toLowerCase();
  if (v === 'pro' || v === 'paid' || v === 'team') return 'pro';
  if (v === 'enterprise') return 'enterprise';
  if (v === 'trial' || v === 'free_trial' || v === 'pro_trial' || v.includes('trial'))
    return 'trial';
  return 'free';
}

export function isUnlimited(limit: Limit): boolean {
  return limit === UNLIMITED;
}

export { UNLIMITED };
