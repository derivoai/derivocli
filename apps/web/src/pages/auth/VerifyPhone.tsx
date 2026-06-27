import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { Phone, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { auth } from '../../lib/firebase';
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential
} from 'firebase/auth';

export function VerifyPhone() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  const isMockMode =
    !import.meta.env.VITE_FIREBASE_API_KEY ||
    import.meta.env.VITE_FIREBASE_MOCK === 'true';

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!phoneNumber || phoneNumber.length < 10) {
      setError('Please enter a valid phone number with country code (e.g. +1 555 000 1234).');
      return;
    }
    setLoading(true);

    if (isMockMode) {
      await new Promise((r) => setTimeout(r, 800));
      setStep('otp');
      setLoading(false);
      return;
    }

    try {
      const recaptchaVerifier = new RecaptchaVerifier(
        auth,
        recaptchaContainerRef.current!,
        { size: 'invisible' }
      );

      const confirmationResult = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        recaptchaVerifier
      );
      (window as any).__firebaseConfirmationResult = confirmationResult;
      setStep('otp');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to send OTP. Check your phone number and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let idToken = 'mock-phone-token';

      if (!isMockMode) {
        const confirmationResult = (window as any).__firebaseConfirmationResult;
        if (!confirmationResult) {
          setError('Session expired. Please start again.');
          setLoading(false);
          return;
        }
        const credential = await confirmationResult.confirm(otp);
        idToken = await credential.user.getIdToken();
      } else {
        if (otp.length < 6) {
          setError('Enter the 6-digit OTP. (Mock mode: any 6 digits work)');
          setLoading(false);
          return;
        }
        await new Promise((r) => setTimeout(r, 600));
      }

      // Retrieve current user token to authorize trial backend request
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError('No active user session. Please sign in again.');
        setLoading(false);
        return;
      }
      const userAuthToken = await currentUser.getIdToken();

      // Call backend to verify and activate trial
      const response = await fetch('/api/trials/verify-phone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userAuthToken}`
        },
        body: JSON.stringify({ idToken, phoneNumber }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Verification failed. Please try again.');
      } else {
        setSuccess(true);
        setTimeout(() => navigate('/dashboard'), 2000);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout title="Trial Activated!" subtitle="Your 3-day Pro Trial is now active">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="flex flex-col items-center justify-center py-8 gap-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-emerald-400" />
          </div>
          <p className="text-sm text-center text-white/60 max-w-xs leading-relaxed">
            Your Pro Trial is active for 3 days. Redirecting to your dashboard...
          </p>
          <div className="w-6 h-6 border-2 border-white/20 border-t-white/70 rounded-full animate-spin mt-2" />
        </motion.div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Verify your phone"
      subtitle="We need to verify your phone number to activate your 3-day Pro Trial"
    >
      <div ref={recaptchaContainerRef} id="recaptcha-container" />

      {isMockMode && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
          🔧 <strong>Mock Mode:</strong> Firebase is not configured. Any 6-digit OTP will work for testing.
        </div>
      )}

      {step === 'phone' ? (
        <form className="flex flex-col gap-4 mt-4" onSubmit={handleSendOtp}>
          <div className="space-y-1">
            <label htmlFor="verify-phone" className="text-xs font-medium text-white/70 ml-1">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="tel"
                id="verify-phone"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1 555 000 1234"
                required
                className="w-full bg-[#050505] border border-white/[0.08] rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all"
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
            disabled={loading}
            className="w-full py-3 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 transition-all shadow-[0_4px_12px_rgba(255,255,255,0.1)] mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />}
            {loading ? 'Sending OTP...' : 'Send Verification Code'}
          </button>
        </form>
      ) : (
        <form className="flex flex-col gap-4 mt-4" onSubmit={handleVerifyOtp}>
          <p className="text-xs text-white/50">
            Code sent to <span className="text-white">{phoneNumber}</span>.{' '}
            <button
              type="button"
              onClick={() => { setStep('phone'); setError(''); }}
              className="text-white/70 hover:text-white underline underline-offset-2"
            >
              Change number
            </button>
          </p>

          <div className="space-y-1">
            <label htmlFor="verify-otp" className="text-xs font-medium text-white/70 ml-1">Verification Code</label>
            <input
              type="text"
              id="verify-otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              maxLength={6}
              required
              className="w-full bg-[#050505] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white tracking-[0.3em] text-center placeholder:text-white/20 placeholder:tracking-normal focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all font-mono"
            />
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || otp.length < 6}
            className="w-full py-3 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 transition-all shadow-[0_4px_12px_rgba(255,255,255,0.1)] mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />}
            {loading ? 'Verifying...' : 'Activate Pro Trial'}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
