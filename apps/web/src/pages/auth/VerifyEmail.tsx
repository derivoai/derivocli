import { Link } from 'react-router-dom';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { MailCheck, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

export function VerifyEmail() {
  return (
    <AuthLayout 
      title="Check your email" 
      subtitle="We sent a verification link to name@example.com"
    >
      <div className="flex flex-col items-center justify-center py-6">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
        >
          <MailCheck className="w-8 h-8 text-white/80" />
        </motion.div>
        
        <p className="text-sm text-center text-white/60 mb-8 max-w-xs leading-relaxed">
          Click the link in the email to verify your account. If you don't see it, check your spam folder.
        </p>

        <button 
          type="button" 
          className="w-full py-3 rounded-xl bg-white/[0.03] text-white border border-white/[0.08] text-sm font-medium hover:bg-white/[0.06] transition-all"
        >
          Resend verification email
        </button>
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
