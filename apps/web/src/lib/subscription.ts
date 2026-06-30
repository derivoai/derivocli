import { db, doc, getDoc, setDoc } from './firebase';

export interface Subscription {
  uid: string;
  plan: 'trial' | 'pro' | 'enterprise' | 'community';
  status: 'active' | 'expired' | 'canceled';
  trialStartedAt: string;
  trialEndsAt: string;
  createdAt: string;
  updatedAt: string;
  /** Newer backend shape (Phase 12+): plan may be in `planId`, status `trialing`. */
  planId?: string;
  currentPeriodEnd?: string;
}

const PAID_PLANS = ['pro', 'enterprise', 'paid', 'team'];
const EXPIRED_STATUSES = ['expired', 'canceled', 'cancelled', 'inactive', 'past_due', 'unpaid'];

/** Read the plan from any supported field (plan / planId / tier / role). */
function resolvePlan(sub: Subscription): string {
  const s = sub as unknown as Record<string, unknown>;
  const raw = s.plan ?? s.planId ?? s.tier ?? s.role ?? '';
  return String(raw).toLowerCase();
}

function resolveStatus(sub: Subscription): string {
  return String((sub as unknown as Record<string, unknown>).status ?? '').toLowerCase();
}

function isTrialPlan(plan: string, status: string): boolean {
  return (
    plan === 'trial' || plan === 'pro_trial' || plan === 'free_trial' || status.includes('trial')
  );
}

/**
 * Saves a subscription document to Firestore.
 * Falls back to the users collection if the subscriptions collection raises permission-denied.
 */
export async function saveSubscription(uid: string, subscription: Subscription): Promise<void> {
  try {
    const docRef = doc(db, 'subscriptions', uid);
    await setDoc(docRef, subscription);
  } catch (error: any) {
    if (error.code === 'permission-denied') {
      console.warn(
        'Permission denied on subscriptions collection, saving to users collection instead',
      );
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, { subscription, updatedAt: new Date().toISOString() }, { merge: true });
      return;
    }
    throw error;
  }
}

/**
 * Fetches the user's subscription document from Firestore.
 * Handles Firestore errors gracefully, falling back to the users collection if subscriptions throws permission-denied.
 */
export async function getSubscription(uid: string): Promise<Subscription | null> {
  try {
    const docRef = doc(db, 'subscriptions', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as Subscription;
    }

    // Check if it exists in users as a fallback
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const data = userSnap.data();
      if (data.subscription) {
        return data.subscription as Subscription;
      }
    }
    return null;
  } catch (error: any) {
    if (error.code === 'permission-denied') {
      console.warn(
        'Permission denied on subscriptions collection, reading from users collection instead',
      );
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        if (data.subscription) {
          return data.subscription as Subscription;
        }
      }
      return null;
    }
    console.error('Error fetching subscription from Firestore:', error);
    throw error;
  }
}

/**
 * Safely parses a date value that may be a Firestore Timestamp, an ISO string, or milliseconds.
 */
export function parseFirebaseDate(val: any): Date {
  if (!val) return new Date();
  if (typeof val.toDate === 'function') {
    return val.toDate();
  }
  if (val.seconds !== undefined) {
    return new Date(val.seconds * 1000);
  }
  const parsed = new Date(val);
  if (isNaN(parsed.getTime())) {
    return new Date();
  }
  return parsed;
}

/**
 * Checks if a subscription is in a trial plan and the trial is active.
 * Recognizes both the legacy shape (`plan:'trial'`, `status:'active'`) and the
 * backend shape (`planId:'trial'`, `status:'trialing'`).
 */
export function isTrialActive(subscription: Subscription): boolean {
  const plan = resolvePlan(subscription);
  const status = resolveStatus(subscription);
  if (!isTrialPlan(plan, status)) return false;
  if (EXPIRED_STATUSES.includes(status)) return false;
  const activeStatus =
    status === 'active' || status === 'trialing' || status === 'trial' || status === '';
  if (!activeStatus) return false;
  const ends = subscription.trialEndsAt;
  if (!ends) return true; // active trial without an end date
  return parseFirebaseDate(ends).getTime() > Date.now();
}

/**
 * Checks if the subscription grants premium privileges.
 * Pro, Enterprise, and active Trials are premium.
 */
export function isPremium(subscription: Subscription): boolean {
  const plan = resolvePlan(subscription);
  const status = resolveStatus(subscription);

  if (PAID_PLANS.includes(plan) && (status === 'active' || status === 'trialing')) {
    return true;
  }
  if (isTrialPlan(plan, status)) {
    return isTrialActive(subscription);
  }
  // A bare "active" status with a future period end is also premium.
  if (status === 'active' && !EXPIRED_STATUSES.includes(status)) {
    const end = subscription.trialEndsAt || subscription.currentPeriodEnd;
    if (end && parseFirebaseDate(end).getTime() > Date.now()) return true;
  }
  return false;
}

/**
 * Gets remaining trial time in milliseconds. Returns 0 if expired.
 */
export function getRemainingTrialTime(subscription: Subscription): number {
  if (!isTrialPlan(resolvePlan(subscription), resolveStatus(subscription))) {
    return 0;
  }
  if (!subscription.trialEndsAt) return 0;
  const endsAt = parseFirebaseDate(subscription.trialEndsAt).getTime();
  return Math.max(0, endsAt - Date.now());
}

/** Derive the user's role from any subscription shape (legacy or backend). */
export function deriveRole(
  subscription: Subscription,
): 'community' | 'pro_trial' | 'pro' | 'enterprise' {
  const plan = resolvePlan(subscription);
  if (plan === 'enterprise') return 'enterprise';
  if (PAID_PLANS.includes(plan) && resolveStatus(subscription) !== 'expired') return 'pro';
  if (isTrialActive(subscription)) return 'pro_trial';
  return 'community';
}

/**
 * Creates a default trial subscription for a user.
 */
export async function createDefaultSubscription(uid: string): Promise<Subscription> {
  const now = new Date();
  const ends = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days trial

  const defaultSub: Subscription = {
    uid,
    plan: 'trial',
    status: 'active',
    trialStartedAt: now.toISOString(),
    trialEndsAt: ends.toISOString(),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  try {
    await saveSubscription(uid, defaultSub);
    return defaultSub;
  } catch (error) {
    console.error('Error creating default subscription in Firestore:', error);
    throw error;
  }
}
