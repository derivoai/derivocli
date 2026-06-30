/**
 * Universal Firebase email action page — handles every auth action mode:
 *   verifyEmail | resetPassword | recoverEmail | verifyAndChangeEmail
 *
 * Action codes are processed via the Firebase Client SDK (applyActionCode,
 * verifyPasswordResetCode, confirmPasswordReset). Resend calls go through the
 * backend API (/api/auth/email) so that links are generated server-side via
 * the Admin SDK and point directly to this page — not Firebase's hosted pages.
 *
 * Design: ActionLayout (plain dark card, no marketing background).
 */
import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import {
  auth,
  applyActionCode,
  checkActionCode,
  verifyPasswordResetCode,
  confirmPasswordReset,
} from '../../lib/firebase';
import { friendlyAuthError, type FriendlyError } from '../../lib/auth-errors';
import {
  ActionLayout,
  ActionSuccessIcon,
  ActionErrorIcon,
  ActionLoadingState,
} from '../../components/auth/ActionLayout';
import { getApiBaseUrl } from '../../lib/api';

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

function scorePassword(pw: string): number {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(s, 4);
}

const STRENGTH_LABELS = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_BARS = [
  'bg-red-500',
  'bg-red-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-emerald-400',
];

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#0a0a0a',
  border: '1px solid #2a2a2a',
  borderRadius: '8px',
  padding: '10px 14px',
  fontSize: '14px',
  color: '#e5e5e5',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
  fontFamily: 'inherit',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 500,
  color: 'rgba(255,255,255,0.55)',
  marginBottom: '6px',
};

const btnPrimary: React.CSSProperties = {
  width: '100%',
  padding: '10px',
  borderRadius: '8px',
  background: '#ffffff',
  color: '#000000',
  fontSize: '14px',
  fontWeight: 600,
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  transition: 'opacity 0.15s',
  fontFamily: 'inherit',
};

const btnGhost: React.CSSProperties = {
  width: '100%',
  padding: '10px',
  borderRadius: '8px',
  background: 'transparent',
  color: 'rgba(255,255,255,0.6)',
  fontSize: '13px',
  fontWeight: 500,
  border: '1px solid #2a2a2a',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  transition: 'background 0.15s, color 0.15s',
  fontFamily: 'inherit',
};

export function Action() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const mode = parseMode(params.get('mode'));
  const oobCode = params.get('oobCode') || '';

  const [phase, setPhase] = useState<Phase>('loading');
  const [success, setSuccess] = useState<SuccessContent | null>(null);
  const [errorState, setErrorState] = useState<FriendlyError | null>(null);

  const [accountEmail, setAccountEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const fail = useCallback((err: unknown, ctx: Parameters<typeof friendlyAuthError>[1]) => {
    setErrorState(friendlyAuthError(err, ctx));
    setPhase('error');
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (mode === 'unknown') {
        if (!cancelled) {
          setErrorState({
            title: 'Invalid request',
            message: 'This link is missing required information.',
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
              title: 'Email verified',
              message: 'Your email has been verified successfully. You can close this window now.',
            });
            setPhase('success');
          }
        } else if (mode === 'verifyAndChangeEmail') {
          const info = await checkActionCode(auth, oobCode);
          await applyActionCode(auth, oobCode);
          if (!cancelled) {
            setSuccess({
              title: 'Email updated',
              message: `Your email has been changed to ${info.data.email ?? 'your new address'}. You can close this window now.`,
            });
            setPhase('success');
          }
        } else if (mode === 'recoverEmail') {
          const info = await checkActionCode(auth, oobCode);
          await applyActionCode(auth, oobCode);
          if (!cancelled) {
            setSuccess({
              title: 'Email recovered',
              message: `Your email has been restored to ${info.data.email ?? 'your previous address'}. You can close this window now.`,
            });
            setPhase('success');
          }
        } else if (mode === 'resetPassword') {
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

  /**
   * Resend a verification email. Calls the backend API so the link is generated
   * server-side via Firebase Admin SDK and points to this page directly —
   * no Firebase console action URL required.
   */
  const handleResend = async () => {
    setResending(true);
    setResent(false);
    try {
      const user = auth.currentUser;
      const token = user ? await user.getIdToken() : null;
      if (!token) {
        setErrorState({
          title: 'Verification failed',
          message: 'Please sign in again to request a new verification email.',
        });
        setPhase('error');
        return;
      }
      const res = await fetch(`${getApiBaseUrl()}/api/auth/email/send-verification`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Backend returned an error');
      setResent(true);
    } catch {
      setErrorState({
        title: 'Could not resend',
        message: 'We could not send a new verification email right now. Please try again shortly.',
      });
    } finally {
      setResending(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <ActionLayout>
        <ActionLoadingState message={loadingMessage(mode)} />
      </ActionLayout>
    );
  }

  // ── Success ────────────────────────────────────────────────────────────────
  if (phase === 'success' && success) {
    return (
      <ActionLayout>
        <div
          className="flex flex-col items-center text-center gap-4"
          role="status"
          aria-live="polite"
        >
          <ActionSuccessIcon />
          <div style={{ marginTop: 4 }}>
            <h1
              style={{
                margin: '0 0 6px',
                fontSize: '16px',
                fontWeight: 600,
                color: '#e5e5e5',
                letterSpacing: '-0.1px',
              }}
            >
              {success.title}
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: '13px',
                color: 'rgba(255,255,255,0.45)',
                lineHeight: 1.6,
              }}
            >
              {success.message}
            </p>
          </div>
        </div>
      </ActionLayout>
    );
  }

  // ── Password reset form ────────────────────────────────────────────────────
  if (phase === 'form' && mode === 'resetPassword') {
    const strength = scorePassword(password);
    return (
      <ActionLayout>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 600, color: '#e5e5e5' }}>
            Set a new password
          </h1>
          {accountEmail && (
            <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
              for {accountEmail}
            </p>
          )}
        </div>

        <form
          onSubmit={handleResetSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          <div>
            <label htmlFor="ap-pw" style={labelStyle}>
              New password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="ap-pw"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                autoComplete="new-password"
                autoFocus
                style={{ ...inputStyle, paddingRight: 38 }}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'rgba(255,255,255,0.35)',
                  padding: 0,
                  display: 'flex',
                }}
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {password.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <div
                  style={{
                    flex: 1,
                    height: 3,
                    borderRadius: 4,
                    background: '#2a2a2a',
                    overflow: 'hidden',
                  }}
                >
                  <motion.div
                    className={STRENGTH_BARS[strength]}
                    style={{ height: '100%' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(strength / 4) * 100}%` }}
                    transition={{ duration: 0.25 }}
                  />
                </div>
                <span
                  style={{
                    fontSize: 10,
                    color: 'rgba(255,255,255,0.35)',
                    minWidth: 44,
                    textAlign: 'right',
                  }}
                >
                  {STRENGTH_LABELS[strength]}
                </span>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="ap-conf" style={labelStyle}>
              Confirm password
            </label>
            <input
              id="ap-conf"
              type={showPw ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="new-password"
              style={inputStyle}
            />
          </div>

          {formError && (
            <div
              role="alert"
              style={{
                padding: '9px 12px',
                borderRadius: 8,
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.18)',
                fontSize: 12,
                color: '#f87171',
              }}
            >
              {formError}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{ ...btnPrimary, opacity: submitting ? 0.6 : 1 }}
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            {submitting ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </ActionLayout>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  return (
    <ActionLayout>
      <div
        className="flex flex-col items-center text-center gap-4"
        role="alert"
        aria-live="assertive"
      >
        <ActionErrorIcon />
        <div style={{ marginTop: 4 }}>
          <h1 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 600, color: '#e5e5e5' }}>
            {errorState?.title || 'Something went wrong'}
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: '13px',
              color: 'rgba(255,255,255,0.45)',
              lineHeight: 1.6,
              maxWidth: 260,
            }}
          >
            {errorState?.message || 'Please try again or request a new link.'}
          </p>
        </div>

        {mode === 'verifyEmail' && (
          <div style={{ width: '100%', marginTop: 4 }}>
            {resent ? (
              <p style={{ margin: 0, fontSize: 12, color: '#34d399', textAlign: 'center' }}>
                Verification email sent. Check your inbox.
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                style={{ ...btnGhost, opacity: resending ? 0.6 : 1 }}
              >
                {resending && <Loader2 size={13} className="animate-spin" />}
                {resending ? 'Sending…' : 'Resend verification email'}
              </button>
            )}
          </div>
        )}

        <a
          href="/login"
          style={{
            fontSize: 12,
            color: 'rgba(255,255,255,0.3)',
            textDecoration: 'underline',
            textUnderlineOffset: 3,
            marginTop: 4,
          }}
        >
          Back to sign in
        </a>
      </div>
    </ActionLayout>
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
