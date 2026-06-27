import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { ArrowLeft, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { auth, sendPasswordResetEmail } from '../../lib/firebase';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSent(false);
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email address.');
      } else {
        setError(err.message || 'Failed to send password reset email. Check your Firebase settings.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset password"
      subtitle="Enter your email address and we'll send you a link to reset your password"
    >
      {sent ? (
        <div className="flex flex-col items-center justify-center py-6 gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7 text-emerald-400" />
          </div>
          <p className="text-sm text-center text-white/60 max-w-xs leading-relaxed">
            Reset link sent! Check your inbox at <span className="text-white font-medium">{email}</span>. If you don't receive it shortly, check your spam folder.
          </p>
        </div>
      ) : (
        <form className="flex flex-col gap-4 mt-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label htmlFor="forgot-email" className="text-xs font-medium text-white/70 ml-1">Email</label>
            <input
              type="email"
              id="forgot-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              className="w-full bg-[#050505] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all"
            />
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 transition-all shadow-[0_4px_12px_rgba(255,255,255,0.1)] mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      )}

      <div className="mt-8 flex justify-center">
        <Link to="/login" className="flex items-center gap-2 text-xs text-white/40 hover:text-white transition-colors group">
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to login
        </Link>
      </div>
    </AuthLayout>
  );
}
