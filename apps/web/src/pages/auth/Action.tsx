import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import {
  auth,
  applyActionCode,
  checkActionCode,
  verifyPasswordResetCode,
  confirmPasswordReset,
  sendEmailVerification,
} from '../../lib/firebase';
import { friendlyAuthError, type FriendlyError } from '../../lib/auth-errors';
import {
  ActionShell,
  SuccessIcon,
  ErrorIcon,
  LoadingState,
} from '../../components/auth/ActionShell';

type Mode = 'verifyEmail' | 'resetPassword' | 'recoverEmail' | 'verifyAndChangeEmail' | 'unknown';
type Phase = 'loading' | 'form' | 'success' | 'error';

interface SuccessContent {
  title: string;
  message: string;
}

function parseMode(raw: string | null): Mode {
  switch (raw) {
    case 'verifyEmail':
    case 'resetPassword':
    case 'recoverEmail':
    case 'verifyAndChangeEmail':
      return raw;
    default:
      return 'unknown';
  }
}

/** Lightweight password strength score (0–4). */
function scorePassword(pw: string): number {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

const STRENGTH_LABELS = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = [
  'bg-red-500',
  'bg-red-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-emerald-400',
];

export function Action() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const mode = parseMode(params.get('mode'));
  const oobCode = params.get('oobCode') || '';

  const [phase, setPhase] = useState<Phase>('loading');
  const [success, setSuccess] = useState<SuccessContent | null>(null);
  const [errorState, setErrorState] = useState<FriendlyError | null>(null);

  // Reset-password form state
  const [accountEmail, setAccountEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Resend-verification state (shown on verifyEmail errors)
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const fail = useCallback((err: unknown, context: Parameters<typeof friendlyAuthError>[1]) => {
    setErrorState(friendlyAuthError(err, context));
    setPhase('error');
  }, []);

  // Run the action when the page loads.
  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (mode === 'unknown') {
        if (!cancelled) {
          setErrorState({
            title: 'Invalid request',
            message: 'This link is missing required information or is not supported.',
          });
          setPhase('error');
        }
        return;
      }
      if (!oobCode) {
        if (!cancelled) fail('auth/invalid-action-code', contextFor(mode));
        return;
      }

      try {
        if (mode === 'verifyEmail') {
          await applyActionCode(auth, oobCode);
          if (!cancelled) {
            setSuccess({
              title: 'Successfully verified',
              message: 'Your email has been verified successfully. You can close this window now.',
            });
            setPhase('success');
          }
        } else if (mode === 'verifyAndChangeEmail') {
          const info = await checkActionCode(auth, oobCode);
          await applyActionCode(auth, oobCode);
          const newEmail = info.data.email || 'your new address';
          if (!cancelled) {
            setSuccess({
              title: 'Email updated',
              message: `Your email has been changed to ${newEmail}. You can close this window now.`,
            });
            setPhase('success');
          }
        } else if (mode === 'recoverEmail') {
          const info = await checkActionCode(auth, oobCode);
          await applyActionCode(auth, oobCode);
          const restored = info.data.email || 'your previous address';
          if (!cancelled) {
            setSuccess({
              title: 'Email recovered',
              message: `Your email has been restored to ${restored}. You can close this window now.`,
            });
            setPhase('success');
          }
        } else if (mode === 'resetPassword') {
          // Validate the code first; reveals the target email and surfaces
          // expired/invalid links before showing the form.
          const email = await verifyPasswordResetCode(auth, oobCode);
          if (!cancelled) {
            setAccountEmail(email);
            setPhase('form');
          }
        }
      } catch (err) {
        if (!cancelled) fail(err, contextFor(mode));
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [mode, oobCode, fail]);

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (password.length < 8) {
      setFormError('Password must be at least 8 characters.');
      return;
    }
    if (scorePassword(password) < 2) {
      setFormError('Please choose a stronger password.');
      return;
    }
    if (password !== confirm) {
      setFormError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setSuccess({
        title: 'Password updated',
        message: 'Password updated successfully. You can close this window now.',
      });
      setPhase('success');
    } catch (err) {
      fail(err, 'resetPassword');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setResent(false);
    setResending(true);
    try {
      const user = auth.currentUser;
      if (user) {
        await sendEmailVerification(user);
        setResent(true);
      } else {
        // Not signed in on this device — guide them to sign in and resend.
        setErrorState({
          title: 'Verification failed',
          message: 'Please sign in again to request a new verification email.',
        });
      }
    } catch {
      setErrorState({
        title: 'Verification failed',
        message: 'We could not resend the email right now. Please try again shortly.',
      });
    } finally {
      setResending(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <ActionShell>
        <LoadingState message={loadingMessage(mode)} />
      </ActionShell>
    );
  }

  if (phase === 'success' && success) {
    return (
      <ActionShell>
        <div
          className="flex flex-col items-center text-center gap-4"
          role="status"
          aria-live="polite"
        >
          <SuccessIcon />
          <div className="space-y-1.5">
            <h1 className="text-base font-semibold text-white">{success.title}</h1>
            <p className="text-sm text-white/55 leading-relaxed max-w-[18rem]">{success.message}</p>
          </div>
        </div>
      </ActionShell>
    );
  }

  if (phase === 'form' && mode === 'resetPassword') {
    const strength = scorePassword(password);
    return (
      <ActionShell>
        <div className="flex flex-col gap-5">
          <div className="text-center space-y-1.5">
            <h1 className="text-base font-semibold text-white">Set a new password</h1>
            <p className="text-sm text-white/55">
              {accountEmail ? `for ${accountEmail}` : 'Choose a strong new password.'}
            </p>
          </div>

          <form className="flex flex-col gap-4" onSubmit={handleResetSubmit}>
            <div className="space-y-1.5">
              <label htmlFor="action-password" className="text-xs font-medium text-white/70 ml-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="action-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  autoFocus
                  className="w-full bg-[#050505] border border-white/[0.08] rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {password.length > 0 && (
                <div className="flex items-center gap-2 pt-1.5 pl-1">
                  <div className="flex-1 h-1 rounded-full bg-white/[0.08] overflow-hidden">
                    <motion.div
                      className={`h-full ${STRENGTH_COLORS[strength]}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${(strength / 4) * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <span className="text-[10px] text-white/40 w-14 text-right">
                    {STRENGTH_LABELS[strength]}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="action-confirm" className="text-xs font-medium text-white/70 ml-1">
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                id="action-confirm"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                className="w-full bg-[#050505] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all"
              />
            </div>

            {formError && (
              <div
                className="px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400"
                role="alert"
              >
                {formError}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 transition-all shadow-[0_4px_12px_rgba(255,255,255,0.1)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </div>
      </ActionShell>
    );
  }

  // Error phase (default fallthrough)
  return (
    <ActionShell>
      <div
        className="flex flex-col items-center text-center gap-4"
        role="alert"
        aria-live="assertive"
      >
        <ErrorIcon />
        <div className="space-y-1.5">
          <h1 className="text-base font-semibold text-white">
            {errorState?.title || 'Something went wrong'}
          </h1>
          <p className="text-sm text-white/55 leading-relaxed max-w-[18rem]">
            {errorState?.message || 'Please try again or request a new link.'}
          </p>
        </div>

        {mode === 'verifyEmail' && (
          <div className="w-full pt-1">
            {resent ? (
              <p className="text-xs text-emerald-400">Verification email sent. Check your inbox.</p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="w-full py-2.5 rounded-xl bg-white/[0.03] text-white border border-white/[0.08] text-sm font-medium hover:bg-white/[0.06] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {resending && <Loader2 className="w-4 h-4 animate-spin" />}
                {resending ? 'Sending…' : 'Resend verification email'}
              </button>
            )}
          </div>
        )}

        <Link
          to="/login"
          className="text-xs text-white/40 hover:text-white transition-colors underline underline-offset-4"
        >
          Back to sign in
        </Link>
      </div>
    </ActionShell>
  );
}

function contextFor(mode: Mode): Parameters<typeof friendlyAuthError>[1] {
  switch (mode) {
    case 'verifyEmail':
      return 'verifyEmail';
    case 'resetPassword':
      return 'resetPassword';
    case 'recoverEmail':
      return 'recoverEmail';
    case 'verifyAndChangeEmail':
      return 'changeEmail';
    default:
      return 'generic';
  }
}

function loadingMessage(mode: Mode): string {
  switch (mode) {
    case 'verifyEmail':
      return 'Verifying your email…';
    case 'resetPassword':
      return 'Validating your reset link…';
    case 'recoverEmail':
      return 'Recovering your email…';
    case 'verifyAndChangeEmail':
      return 'Updating your email…';
    default:
      return 'Processing…';
  }
}
