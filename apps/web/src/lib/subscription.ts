import { db, doc, getDoc, setDoc } from './firebase';

export interface Subscription {
  uid: string;
  plan: 'trial' | 'pro' | 'community';
  status: 'active' | 'expired' | 'canceled';
  trialStartedAt: string;
  trialEndsAt: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Fetches the user's subscription document from Firestore.
 * Handles Firestore errors gracefully.
 */
export async function getSubscription(uid: string): Promise<Subscription | null> {
  try {
    const docRef = doc(db, 'subscriptions', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as Subscription;
    }
    return null;
  } catch (error) {
    console.error('Error fetching subscription from Firestore:', error);
    throw error;
  }
}

/**
 * Checks if a subscription is in a trial plan and the trial is active (has not expired).
 */
export function isTrialActive(subscription: Subscription): boolean {
  if (subscription.plan !== 'trial' || subscription.status !== 'active') {
    return false;
  }
  const endsAt = new Date(subscription.trialEndsAt).getTime();
  return endsAt > Date.now();
}

/**
 * Checks if the subscription grants premium privileges.
 * Pro plans are premium. Active trials are also premium.
 */
export function isPremium(subscription: Subscription): boolean {
  if (subscription.plan === 'pro' && subscription.status === 'active') {
    return true;
  }
  return isTrialActive(subscription);
}

/**
 * Gets remaining trial time in milliseconds. Returns 0 if expired.
 */
export function getRemainingTrialTime(subscription: Subscription): number {
  if (subscription.plan !== 'trial') {
    return 0;
  }
  const endsAt = new Date(subscription.trialEndsAt).getTime();
  return Math.max(0, endsAt - Date.now());
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
    const docRef = doc(db, 'subscriptions', uid);
    await setDoc(docRef, defaultSub);
    return defaultSub;
  } catch (error) {
    console.error('Error creating default subscription in Firestore:', error);
    throw error;
  }
}
