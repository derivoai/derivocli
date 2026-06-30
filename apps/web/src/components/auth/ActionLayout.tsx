/**
 * Minimal, self-contained layout for Firebase email action pages.
 *
 * Deliberately plain — no Background component, no floating orbs, no grid, no
 * marketing sections. The design resembles GitHub / Vercel / Stripe auth pages:
 *   - Very subtle radial gradient on the background
 *   - Plain centred card with a light border
 *   - Small Derivo wordmark, no nav, no footer, no hero
 */
import { ReactNode } from 'react';
import { motion } from 'motion/react';
import { Check, X, Loader2 } from 'lucide-react';
import { Logo } from '../landing/Logo';

export function ActionLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 font-sans text-white selection:bg-white/20"
      style={{
        backgroundColor: '#0a0a0a',
        backgroundImage:
          'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(255,255,255,0.04) 0%, transparent 70%)',
      }}
    >
      {/* Wordmark */}
      <div className="mb-8 flex items-center gap-2.5">
        <Logo className="w-6 h-6" />
        <span className="text-sm font-semibold tracking-tight text-white/90">Derivo</span>
      </div>

      {/* Card */}
      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[360px]"
      >
        <div
          className="rounded-xl px-8 py-8"
          style={{
            backgroundColor: '#111111',
            border: '1px solid #222222',
            boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          }}
        >
          {children}
        </div>
      </motion.main>
    </div>
  );
}

/** Small animated success checkmark. */
export function ActionSuccessIcon() {
  return (
    <motion.div
      initial={{ scale: 0.7, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 240, damping: 18 }}
      className="w-10 h-10 rounded-full flex items-center justify-center"
      style={{
        backgroundColor: 'rgba(16,185,129,0.12)',
        border: '1px solid rgba(16,185,129,0.25)',
      }}
      role="img"
      aria-label="Success"
    >
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.12, type: 'spring', stiffness: 320, damping: 16 }}
      >
        <Check className="w-5 h-5 text-emerald-400" strokeWidth={2.5} />
      </motion.span>
    </motion.div>
  );
}

/** Small error icon. */
export function ActionErrorIcon() {
  return (
    <motion.div
      initial={{ scale: 0.7, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 240, damping: 18 }}
      className="w-10 h-10 rounded-full flex items-center justify-center"
      style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
      role="img"
      aria-label="Error"
    >
      <X className="w-5 h-5 text-red-400" strokeWidth={2.5} />
    </motion.div>
  );
}

/** Inline loading state. */
export function ActionLoadingState({ message }: { message: string }) {
  return (
    <div
      className="flex flex-col items-center text-center gap-3 py-2"
      role="status"
      aria-live="polite"
    >
      <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'rgba(255,255,255,0.5)' }} />
      <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
        {message}
      </p>
    </div>
  );
}
