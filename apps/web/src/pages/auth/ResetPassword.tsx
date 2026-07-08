import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { ArrowLeft, AlertTriangle, Loader2 } from 'lucide-react';
import { auth, confirmPasswordReset } from '../../lib/firebase';

export function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = new URLSearchParams(location.search).get('oobCode') || ''; // Firebase uses oobCode param name

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (!token) {
      setError('Invalid or expired reset link. Please request a new link via Forgot Password.');
      return;
    }
    setLoading(true);
    try {
      await confirmPasswordReset(auth, token, password);
      navigate('/login?reset=success');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/expired-action-code') {
        setError('This password reset link has expired. Please request a new one.');
      } else if (err.code === 'auth/invalid-action-code') {
        setError('This password reset link is invalid or has already been used.');
      } else {
        setError(err.message || 'Password reset failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create new password"
      subtitle="Your new password must be different from previous used passwords"
    >
      <form className="flex flex-col gap-4 mt-4" onSubmit={handleSubmit}>
        <div className="space-y-1">
          <label htmlFor="reset-password" className="text-xs font-medium text-foreground ml-1">
            New Password
          </label>
          <input
            type="password"
            id="reset-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={8}
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="reset-confirm-password"
            className="text-xs font-medium text-foreground ml-1"
          >
            Confirm Password
          </label>
          <input
            type="password"
            id="reset-confirm-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
          />
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>

      <div className="mt-8 flex justify-center">
        <Link
          to="/login"
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to login
        </Link>
      </div>
    </AuthLayout>
  );
}
