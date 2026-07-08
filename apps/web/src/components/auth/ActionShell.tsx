import { ReactNode } from 'react';
import { motion } from 'motion/react';
import { Check, X, Loader2 } from 'lucide-react';
import { Background } from '../landing/Background';
import { Logo } from '../landing/Logo';
import { Link } from 'react-router-dom';

/**
 * Compact, centered shell for Firebase email action pages. Intentionally small
 * and minimal (max-w-sm, no oversized hero) — premium SaaS feel similar to
 * Linear / Vercel / Stripe. Reused across every action state.
 */
export function ActionShell({ children }: { children: ReactNode }) {
  return (
    <div className="lightui relative min-h-screen bg-background overflow-hidden flex flex-col items-center justify-center font-sans text-foreground selection:bg-accent/20 px-6">
      <Background />

      <Link
        to="/"
        className="absolute top-8 left-8 md:top-10 md:left-10 z-20 group"
        aria-label="Derivo home"
      >
        <Logo className="w-7 h-7 text-muted-foreground group-hover:text-foreground transition-colors" />
      </Link>

      <motion.main
        initial={{ opacity: 0, y: 12, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="rounded-2xl bg-background border border-border p-8 shadow-xl shadow-foreground/5">
          {children}
        </div>
      </motion.main>
    </div>
  );
}

/** Small animated success checkmark in a soft circular badge. */
export function SuccessIcon() {
  return (
    <motion.div
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 18 }}
      className="w-12 h-12 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center"
      role="img"
      aria-label="Success"
    >
      <motion.span
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 16 }}
      >
        <Check className="w-6 h-6 text-emerald-600" strokeWidth={2.5} />
      </motion.span>
    </motion.div>
  );
}

/** Small error icon in a soft circular badge. */
export function ErrorIcon() {
  return (
    <motion.div
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 18 }}
      className="w-12 h-12 rounded-full bg-red-100 border border-red-200 flex items-center justify-center"
      role="img"
      aria-label="Error"
    >
      <X className="w-6 h-6 text-red-600" strokeWidth={2.5} />
    </motion.div>
  );
}

/** Centered loading spinner with a status message. */
export function LoadingState({ message }: { message: string }) {
  return (
    <div
      className="flex flex-col items-center text-center gap-4 py-2"
      role="status"
      aria-live="polite"
    >
      <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
