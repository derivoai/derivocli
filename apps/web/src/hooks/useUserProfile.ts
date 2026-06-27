import { useState, useEffect } from 'react';
import { auth, db, doc, getDoc, setDoc } from '../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: 'community' | 'pro_trial' | 'pro';
  createdAt?: string;
  trialExpiresAt?: string;
}

export function useUserProfile() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      setCurrentUser(user);
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          setProfile({
            uid: user.uid,
            name: data.name || user.displayName || user.email?.split('@')[0] || 'User',
            email: data.email || user.email || '',
            role: data.role || 'community',
            createdAt: data.createdAt,
            trialExpiresAt: data.trialExpiresAt
          });
        } else {
          // If profile does not exist (e.g., first social login), create default profile
          const defaultProfile: UserProfile = {
            uid: user.uid,
            name: user.displayName || user.email?.split('@')[0] || 'User',
            email: user.email || '',
            role: 'community',
            createdAt: new Date().toISOString()
          };
          await setDoc(userRef, {
            name: defaultProfile.name,
            email: defaultProfile.email,
            role: defaultProfile.role,
            createdAt: defaultProfile.createdAt,
            updatedAt: new Date().toISOString()
          });
          setProfile(defaultProfile);
        }
      } catch (err) {
        console.error('Error fetching or creating user profile in Firestore:', err);
        // Fallback profile if Firestore rules/network fails temporarily
        setProfile({
          uid: user.uid,
          name: user.displayName || user.email?.split('@')[0] || 'User',
          email: user.email || '',
          role: 'community'
        });
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return { currentUser, profile, loading };
}
