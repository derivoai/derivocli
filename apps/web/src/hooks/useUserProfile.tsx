import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, doc, getDoc, setDoc } from '../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { getSubscription, createDefaultSubscription, Subscription, isTrialActive } from '../lib/subscription';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: 'community' | 'pro_trial' | 'pro';
  createdAt?: string;
  trialExpiresAt?: string;
}

interface UserProfileContextType {
  currentUser: User | null;
  profile: UserProfile | null;
  subscription: Subscription | null;
  loading: boolean;
  error: string | null;
  refreshSubscription: () => Promise<void>;
  updateProfileData: (name: string) => Promise<void>;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfileAndSubscription = async (user: User) => {
    try {
      setError(null);
      // Fetch profile
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      let currentProfile: UserProfile;

      if (userSnap.exists()) {
        const data = userSnap.data();
        currentProfile = {
          uid: user.uid,
          name: data.name || user.displayName || user.email?.split('@')[0] || 'User',
          email: data.email || user.email || '',
          role: data.role || 'community',
          createdAt: data.createdAt,
        };
      } else {
        // Create profile
        const defaultProfile: UserProfile = {
          uid: user.uid,
          name: user.displayName || user.email?.split('@')[0] || 'User',
          email: user.email || '',
          role: 'community',
          createdAt: new Date().toISOString(),
        };
        await setDoc(userRef, {
          name: defaultProfile.name,
          email: defaultProfile.email,
          role: defaultProfile.role,
          createdAt: defaultProfile.createdAt,
          updatedAt: new Date().toISOString(),
        });
        currentProfile = defaultProfile;
      }

      // Fetch subscription
      let currentSub = await getSubscription(user.uid);
      if (!currentSub) {
        // Auto-create missing subscription (empty state safety)
        currentSub = await createDefaultSubscription(user.uid);
      }

      // Dynamically check and compute role based on active subscription
      const derivedRole: 'community' | 'pro_trial' | 'pro' = currentSub.plan === 'pro'
        ? 'pro'
        : (currentSub.plan === 'trial' && isTrialActive(currentSub))
          ? 'pro_trial'
          : 'community';

      // Update role in Firestore if it has changed to keep it in sync
      if (currentProfile.role !== derivedRole) {
        currentProfile.role = derivedRole;
        try {
          await setDoc(userRef, { role: derivedRole, updatedAt: new Date().toISOString() }, { merge: true });
        } catch (e) {
          console.warn('Could not update profile role in Firestore:', e);
        }
      }

      setProfile(currentProfile);
      setSubscription(currentSub);
    } catch (err: any) {
      console.error('Error fetching/creating profile and subscription:', err);
      if (err.code === 'permission-denied') {
        setError('Permission denied when accessing user data. Please check your credentials.');
      } else if (err.code === 'unavailable') {
        setError('Firestore service is temporarily unavailable. Check your internet connection.');
      } else {
        setError(err.message || 'Failed to load user account details.');
      }

      // Fallback
      setProfile({
        uid: user.uid,
        name: user.displayName || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        role: 'community',
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshSubscription = async () => {
    if (!currentUser) return;
    try {
      let currentSub = await getSubscription(currentUser.uid);
      if (!currentSub) {
        currentSub = await createDefaultSubscription(currentUser.uid);
      }
      setSubscription(currentSub);

      // Re-derive role
      const derivedRole: 'community' | 'pro_trial' | 'pro' = currentSub.plan === 'pro'
        ? 'pro'
        : (currentSub.plan === 'trial' && isTrialActive(currentSub))
          ? 'pro_trial'
          : 'community';

      if (profile && profile.role !== derivedRole) {
        const updatedProfile = { ...profile, role: derivedRole };
        setProfile(updatedProfile);
        const userRef = doc(db, 'users', currentUser.uid);
        await setDoc(userRef, { role: derivedRole, updatedAt: new Date().toISOString() }, { merge: true });
      }
    } catch (err) {
      console.error('Failed to refresh subscription:', err);
    }
  };

  const updateProfileData = async (name: string) => {
    if (!currentUser || !profile) return;
    const userRef = doc(db, 'users', currentUser.uid);
    await setDoc(userRef, { name, updatedAt: new Date().toISOString() }, { merge: true });
    setProfile({ ...profile, name });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      setCurrentUser(user);
      if (!user) {
        setProfile(null);
        setSubscription(null);
        setLoading(false);
        setError(null);
        return;
      }
      await fetchProfileAndSubscription(user);
    });

    return () => unsubscribe();
  }, []);

  return (
    <UserProfileContext.Provider value={{ currentUser, profile, subscription, loading, error, refreshSubscription, updateProfileData }}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
}
export type { Subscription };
