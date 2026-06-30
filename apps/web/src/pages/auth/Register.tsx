import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { Github, ArrowLeft, ArrowRight } from 'lucide-react';
import {
  auth,
  db,
  doc,
  setDoc,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  googleProvider,
  githubProvider,
} from '../../lib/firebase';
import { updateProfile, getAdditionalUserInfo } from 'firebase/auth';
import { getApiBaseUrl } from '../../lib/api';

type Step = 'name' | 'credentials';

export function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('name');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Complete any pending OAuth redirect sign-in. New users go to onboarding.
  useEffect(() => {
    getRedirectResult(auth)
      .then((result: any) => {
        if (result?.user) {
          const isNew = getAdditionalUserInfo(result)?.isNewUser;
          navigate(isNew ? '/onboarding' : '/dashboard');
        }
      })
      .catch((err: any) => {
        console.error('Redirect result error:', err);
        setError(err.message || 'OAuth redirect failed.');
      });
  }, [navigate]);

  const handleContinueFromName = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!firstName.trim()) {
      setError('Please enter your first name.');
      return;
    }
    setStep('credentials');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      if (user) {
        await updateProfile(user, { displayName: fullName });

        // Persist the structured profile so onboarding/dashboard have names.
        try {
          await setDoc(
            doc(db, 'users', user.uid),
            {
              name: fullName,
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              email: user.email || email,
              role: 'community',
              onboardingCompleted: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            { merge: true },
          );
        } catch (profileErr) {
          console.warn('Could not write profile during register', profileErr);
        }

        try {
          // Tell the backend about the new account. This runs abuse checks,
          // persists the email fingerprint, and writes the authoritative
          // subscription document (trial inheritance if this email was seen before).
          const token = await user.getIdToken();
          await fetch(`${getApiBaseUrl()}/api/account/register`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              firstName: firstName.trim(),
              lastName: lastName.trim(),
            }),
          }).catch((err) => console.warn('Could not register account with backend', err));
        } catch (regErr) {
          console.warn('Backend account registration failed', regErr);
        }

        try {
          // Send verification email through backend (Admin SDK link generation —
          // no Firebase Console action URL required).
          const token = await user.getIdToken();
          await fetch(`${getApiBaseUrl()}/api/auth/email/send-verification`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          }).catch((err) => console.warn('Could not send verification email via API', err));
        } catch (verifyErr) {
          console.warn('Failed to request verification email', verifyErr);
        }
      }
      navigate('/verify-email');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('This email address is already in use.');
        setStep('credentials');
      } else {
        setError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (
    provider: typeof googleProvider | typeof githubProvider,
    label: string,
  ) => {
    setError('');
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const isNew = getAdditionalUserInfo(result)?.isNewUser;

      // For brand-new OAuth accounts, tell the backend so the email fingerprint
      // is recorded and the subscription document is created properly.
      if (isNew && result.user) {
        try {
          const token = await result.user.getIdToken();
          await fetch(`${getApiBaseUrl()}/api/account/register`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              firstName: result.user.displayName?.split(' ')[0]?.trim() ?? '',
              lastName: result.user.displayName?.split(' ').slice(1).join(' ')?.trim() ?? '',
            }),
          }).catch((err) => console.warn('Could not register OAuth account with backend', err));
        } catch (regErr) {
          console.warn('Backend account registration failed for OAuth user', regErr);
        }
      }

      // New OAuth users complete first/last name + onboarding; existing users
      // go straight to the dashboard.
      navigate(isNew ? '/onboarding' : '/dashboard');
    } catch (err: any) {
      console.warn('Popup sign-up failed, attempting redirect...', err);
      try {
        await signInWithRedirect(auth, provider);
      } catch (redirErr: any) {
        setError(redirErr.message || `${label} Sign-Up failed.`);
        setLoading(false);
      }
    }
  };

  const inputClass =
    'w-full bg-[#050505] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all';

  return (
    <AuthLayout title="Create an account" subtitle="Join Derivo and start building faster">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        <span
          className={`h-1.5 rounded-full transition-all ${step === 'name' ? 'w-8 bg-white' : 'w-4 bg-white/20'}`}
        />
        <span
          className={`h-1.5 rounded-full transition-all ${step === 'credentials' ? 'w-8 bg-white' : 'w-4 bg-white/20'}`}
        />
      </div>

      {step === 'name' && (
        <>
          <div className="flex flex-col gap-4 mb-8">
            <button
              type="button"
              onClick={() => handleOAuth(googleProvider, 'Google')}
              disabled={loading}
              className="flex items-center justify-center gap-3 w-full py-3 px-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-all text-sm font-medium disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </button>
            <button
              type="button"
              onClick={() => handleOAuth(githubProvider, 'GitHub')}
              disabled={loading}
              className="flex items-center justify-center gap-3 w-full py-3 px-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-all text-sm font-medium disabled:opacity-50"
            >
              <Github className="w-4 h-4" />
              Continue with GitHub
            </button>
          </div>

          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.06]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#0b0b0b] px-3 text-white/40">Or register with email</span>
            </div>
          </div>

          <form className="flex flex-col gap-4" onSubmit={handleContinueFromName}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="register-first" className="text-xs font-medium text-white/70 ml-1">
                  First Name
                </label>
                <input
                  type="text"
                  id="register-first"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Jane"
                  required
                  autoFocus
                  className={inputClass}
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="register-last" className="text-xs font-medium text-white/70 ml-1">
                  Last Name
                </label>
                <input
                  type="text"
                  id="register-last"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  className={inputClass}
                />
              </div>
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 transition-all shadow-[0_4px_12px_rgba(255,255,255,0.1)] mt-2 flex items-center justify-center gap-2"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </>
      )}

      {step === 'credentials' && (
        <form className="flex flex-col gap-4" onSubmit={handleRegister}>
          <div className="space-y-1">
            <label htmlFor="register-email" className="text-xs font-medium text-white/70 ml-1">
              Email
            </label>
            <input
              type="email"
              id="register-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              autoFocus
              className={inputClass}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="register-password" className="text-xs font-medium text-white/70 ml-1">
              Password
            </label>
            <input
              type="password"
              id="register-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              className={inputClass}
            />
            <p className="text-[11px] text-white/30 ml-1 pt-1">At least 8 characters.</p>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3 mt-2">
            <button
              type="button"
              onClick={() => {
                setError('');
                setStep('name');
              }}
              disabled={loading}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-all text-sm font-medium disabled:opacity-50"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 transition-all shadow-[0_4px_12px_rgba(255,255,255,0.1)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && (
                <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              )}
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </div>
        </form>
      )}

      <div className="mt-8 text-center text-xs text-white/40">
        Already have an account?{' '}
        <Link to="/login" className="text-white hover:underline underline-offset-4">
          Sign in
        </Link>
      </div>

      <p className="mt-6 text-center text-[10px] text-white/30 max-w-xs mx-auto leading-relaxed">
        By clicking continue, you agree to our{' '}
        <Link
          to="/terms"
          className="hover:text-white transition-colors underline underline-offset-2"
        >
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link
          to="/privacy"
          className="hover:text-white transition-colors underline underline-offset-2"
        >
          Privacy Policy
        </Link>
        .
      </p>
    </AuthLayout>
  );
}
