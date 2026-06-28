import { db, doc, getDoc, setDoc } from './firebase';

export interface Subscription {
  uid: string;
  plan: 'trial' | 'pro' | 'enterprise' | 'community';
  status: 'active' | 'expired' | 'canceled';
  trialStartedAt: string;
  trialEndsAt: string;
  createdAt: string;
  updatedAt: string;
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
      console.warn('Permission denied on subscriptions collection, saving to users collection instead');
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
      console.warn('Permission denied on subscriptions collection, reading from users collection instead');
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
 * Pro, Enterprise, and active Trial plans are premium.
 */
export function isPremium(subscription: Subscription): boolean {
  if (subscription.plan === 'enterprise' && subscription.status === 'active') {
    return true;
  }
  if (subscription.plan === 'pro' && subscription.status === 'active') {
    return true;
  }
  if (subscription.plan === 'trial') {
    return isTrialActive(subscription);
  }
  return false;
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
    await saveSubscription(uid, defaultSub);
    return defaultSub;
  } catch (error) {
    console.error('Error creating default subscription in Firestore:', error);
    throw error;
  }
}
