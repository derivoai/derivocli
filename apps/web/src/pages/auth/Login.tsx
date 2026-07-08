import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { Github } from 'lucide-react';
import {
  auth,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  googleProvider,
  githubProvider,
} from '../../lib/firebase';
import { getAdditionalUserInfo } from 'firebase/auth';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const callbackUrl = params.get('callbackUrl') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle redirect result on mount
  useEffect(() => {
    getRedirectResult(auth)
      .then((result: any) => {
        if (result?.user) {
          const isNew = getAdditionalUserInfo(result)?.isNewUser;
          navigate(isNew ? '/onboarding' : callbackUrl);
        }
      })
      .catch((err: any) => {
        console.error('Redirect result error:', err);
        setError(err.message || 'OAuth redirect failed.');
      });
  }, [navigate, callbackUrl]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate(callbackUrl);
    } catch (err: any) {
      console.error(err);
      if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password'
      ) {
        setError('Invalid email or password.');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      // In iframes/sandboxes, popups might be blocked, so check for popup blockers
      const result = await signInWithPopup(auth, googleProvider);
      const isNew = getAdditionalUserInfo(result)?.isNewUser;
      navigate(isNew ? '/onboarding' : callbackUrl);
    } catch (err: any) {
      console.warn('Popup login failed, attempting redirect...', err);
      try {
        await signInWithRedirect(auth, googleProvider);
      } catch (redirErr: any) {
        setError(redirErr.message || 'Google Sign-In failed.');
        setLoading(false);
      }
    }
  };

  const handleGithubLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, githubProvider);
      const isNew = getAdditionalUserInfo(result)?.isNewUser;
      navigate(isNew ? '/onboarding' : callbackUrl);
    } catch (err: any) {
      console.warn('Popup login failed, attempting redirect...', err);
      try {
        await signInWithRedirect(auth, githubProvider);
      } catch (redirErr: any) {
        setError(redirErr.message || 'GitHub Sign-In failed.');
        setLoading(false);
      }
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your Derivo account to continue">
      <div className="flex flex-col gap-4 mb-8">
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="flex items-center justify-center gap-3 w-full py-3 px-4 rounded-xl bg-background border border-border hover:bg-secondary transition-all text-sm font-medium disabled:opacity-50"
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
          onClick={handleGithubLogin}
          disabled={loading}
          className="flex items-center justify-center gap-3 w-full py-3 px-4 rounded-xl bg-background border border-border hover:bg-secondary transition-all text-sm font-medium disabled:opacity-50"
        >
          <Github className="w-4 h-4" />
          Continue with GitHub
        </button>
      </div>

      <div className="relative mb-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-background px-3 text-muted-foreground">Or continue with email</span>
        </div>
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleEmailLogin}>
        <div className="space-y-1">
          <label htmlFor="login-email" className="text-xs font-medium text-foreground ml-1">
            Email
          </label>
          <input
            type="email"
            id="login-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            required
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between ml-1">
            <label htmlFor="login-password" className="text-xs font-medium text-foreground">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            id="login-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
          />
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading && (
            <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
          )}
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="mt-8 text-center text-xs text-muted-foreground">
        Don't have an account?{' '}
        <Link to="/register" className="text-accent hover:underline underline-offset-4">
          Sign up
        </Link>
      </div>
    </AuthLayout>
  );
}
