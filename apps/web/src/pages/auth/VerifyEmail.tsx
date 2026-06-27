import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { MailCheck, ArrowLeft, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { auth, sendEmailVerification } from '../../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

export function VerifyEmail() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const email = currentUser?.email || 'your email';

  const handleResend = async () => {
    if (!currentUser) {
      setError('You must be signed in to request a verification email. Please sign in again.');
      return;
    }
    setError('');
    setResent(false);
    setLoading(true);
    try {
      await sendEmailVerification(currentUser);
      setResent(true);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/too-many-requests') {
        setError('Too many requests. Please wait a moment and try again.');
      } else {
        setError(err.message || 'Failed to send verification email. Make sure your Firebase email provider is active.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Check your email"
      subtitle={`We sent a verification link to ${email}`}
    >
      <div className="flex flex-col items-center justify-center py-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
        >
          <MailCheck className="w-8 h-8 text-white/80" />
        </motion.div>

        <p className="text-sm text-center text-white/60 mb-8 max-w-xs leading-relaxed">
          Click the link in the email to verify your account. Once verified, refresh the page or log back in to access the dashboard.
        </p>

        {error && (
          <div className="w-full mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {resent ? (
          <div className="flex items-center gap-2 text-sm text-emerald-400 mb-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Verification email resent!
          </div>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-white/[0.03] text-white border border-white/[0.08] text-sm font-medium hover:bg-white/[0.06] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Sending...' : 'Resend verification email'}
          </button>
        )}
      </div>

      <div className="mt-6 flex justify-center">
        <Link to="/login" className="flex items-center gap-2 text-xs text-white/40 hover:text-white transition-colors group">
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to login
        </Link>
      </div>
    </AuthLayout>
  );
}
