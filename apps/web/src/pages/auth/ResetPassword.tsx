import { Link } from 'react-router-dom';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { ArrowLeft } from 'lucide-react';

export function ResetPassword() {
  return (
    <AuthLayout 
      title="Create new password" 
      subtitle="Your new password must be different from previous used passwords"
    >
      <form className="flex flex-col gap-4 mt-4">
        <div className="space-y-1">
          <label htmlFor="password" className="text-xs font-medium text-white/70 ml-1">New Password</label>
          <input 
            type="password" 
            id="password" 
            placeholder="••••••••"
            className="w-full bg-[#050505] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all"
          />
        </div>
        
        <div className="space-y-1">
          <label htmlFor="confirmPassword" className="text-xs font-medium text-white/70 ml-1">Confirm Password</label>
          <input 
            type="password" 
            id="confirmPassword" 
            placeholder="••••••••"
            className="w-full bg-[#050505] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all"
          />
        </div>

        <button 
          type="button" 
          className="w-full py-3 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 transition-all shadow-[0_4px_12px_rgba(255,255,255,0.1)] mt-2"
        >
          Reset Password
        </button>
      </form>

      <div className="mt-8 flex justify-center">
        <Link to="/login" className="flex items-center gap-2 text-xs text-white/40 hover:text-white transition-colors group">
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to login
        </Link>
      </div>
    </AuthLayout>
  );
}
