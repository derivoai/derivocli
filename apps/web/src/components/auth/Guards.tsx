import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { auth } from '../../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

function LoadingSpinner({ message = 'Verifying session...' }: { message?: string }) {
  return (
    <div className="lightui min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-border border-t-accent animate-spin" />
        <span className="text-xs text-muted-foreground font-mono">{message}</span>
      </div>
    </div>
  );
}

/**
 * Evaluates whether the user's email verification requirement is satisfied
 * according to actual Firebase user and provider data.
 */
export function checkEmailVerified(user: User): boolean {
  return user.emailVerified;
}

/**
 * Guard for Protected / Dashboard Routes (/dashboard, /projects, /settings, /billing, etc.)
 * - Unauthenticated -> /login
 * - Authenticated & Unverified -> /verify-email
 * - Authenticated & Verified -> Render page
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser: User | null) => {
      if (currentUser) {
        try {
          await currentUser.reload();
        } catch (e) {
          // ignore reload errors
        }
      }
      setUser(auth.currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Verifying authentication..." />;
  }

  if (!user) {
    return <Navigate to={`/login?callbackUrl=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (!checkEmailVerified(user)) {
    return <Navigate to="/verify-email" replace />;
  }

  return <>{children}</>;
}

/**
 * Guard for Verify Email Route (/verify-email)
 * - Unauthenticated -> /login
 * - Authenticated & Unverified -> Render verify-email page
 * - Authenticated & Verified -> /dashboard
 */
export function VerifyEmailRouteGuard({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser: User | null) => {
      if (currentUser) {
        try {
          await currentUser.reload();
        } catch (e) {
          // ignore reload errors
        }
      }
      setUser(auth.currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Checking verification status..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (checkEmailVerified(user)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

/**
 * Guard for Public Auth Routes (/login, /register, /forgot-password, /reset-password)
 * - Unauthenticated -> Render auth form
 * - Authenticated & Unverified -> /verify-email
 * - Authenticated & Verified -> /dashboard
 */
export function PublicAuthGuard({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser: User | null) => {
      if (currentUser) {
        try {
          await currentUser.reload();
        } catch (e) {
          // ignore reload errors
        }
      }
      setUser(auth.currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Checking session..." />;
  }

  if (user && checkEmailVerified(user)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

/**
 * Guard for Root Landing Page (/)
 * - Unauthenticated -> Render landing page
 * - Authenticated & Unverified -> /verify-email
 * - Authenticated & Verified -> /dashboard
 */
export function RootLandingGuard({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser: User | null) => {
      if (currentUser) {
        try {
          await currentUser.reload();
        } catch (e) {
          // ignore reload errors
        }
      }
      setUser(auth.currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading..." />;
  }

  if (user) {
    if (!checkEmailVerified(user)) {
      return <Navigate to="/verify-email" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
