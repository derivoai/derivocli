/**
 * Usage tracking — counts real resource usage from Firestore so feature gates
 * and the dashboard can show current / maximum / remaining.
 */
import { getDb, isAdminInitialized } from '../firebase.js';
import { getPlan, isUnlimited, normalizePlanId, type Feature } from './plans.js';
import { getSubscriptionState } from './subscription-service.js';

/** Firestore subcollection backing each countable feature (when applicable). */
const FEATURE_COLLECTION: Partial<Record<Feature, string>> = {
  projects: 'projects',
  devices: 'devices',
  apiKeys: 'apiKeys',
  plugins: 'plugins',
};

/** Count current usage for a single feature. */
export async function getUsage(uid: string, feature: Feature): Promise<number> {
  const collection = FEATURE_COLLECTION[feature];
  if (!collection || !isAdminInitialized()) return 0;
  try {
    const snap = await getDb().collection('users').doc(uid).collection(collection).get();
    // Exclude soft-deleted / revoked records.
    return snap.docs.filter((d) => {
      const data = d.data() as Record<string, unknown>;
      return !data.deletedAt && data.status !== 'deleted' && data.revoked !== true;
    }).length;
  } catch {
    return 0;
  }
}

export interface UsageEntry {
  used: number;
  limit: number; // -1 unlimited
  remaining: number; // -1 unlimited
}

export interface UsageReport {
  planId: string;
  usage: Record<string, UsageEntry>;
}

const TRACKED: Feature[] = ['projects', 'devices', 'apiKeys', 'plugins', 'ai', 'storage'];

/** Full usage report for the dashboard. */
export async function getUsageReport(uid: string): Promise<UsageReport> {
  const state = await getSubscriptionState(uid);
  const plan = getPlan(normalizePlanId(state.planId));
  const usage: Record<string, UsageEntry> = {};

  for (const feature of TRACKED) {
    const limit = plan.limits[feature];
    const used = await getUsage(uid, feature);
    usage[feature] = {
      used,
      limit,
      remaining: isUnlimited(limit) ? -1 : Math.max(0, limit - used),
    };
  }

  return { planId: state.planId, usage };
}
