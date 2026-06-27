import { Link } from 'react-router-dom';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { Github } from 'lucide-react';

export function Register() {
  return (
    <AuthLayout 
      title="Create an account" 
      subtitle="Join Derivo and start building faster"
    >
      <div className="flex flex-col gap-4 mb-8">
        <button className="flex items-center justify-center gap-3 w-full py-3 px-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-all text-sm font-medium">
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </button>
        <button className="flex items-center justify-center gap-3 w-full py-3 px-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-all text-sm font-medium">
          <Github className="w-4 h-4" />
          Continue with GitHub
        </button>
      </div>

      <div className="relative mb-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/[0.06]"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-[#0b0b0b] px-3 text-white/40">Or register with email</span>
        </div>
      </div>

      <form className="flex flex-col gap-4">
        <div className="space-y-1">
          <label htmlFor="name" className="text-xs font-medium text-white/70 ml-1">Full Name</label>
          <input 
            type="text" 
            id="name" 
            placeholder="Jane Doe"
            className="w-full bg-[#050505] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all"
          />
        </div>
        
        <div className="space-y-1">
          <label htmlFor="email" className="text-xs font-medium text-white/70 ml-1">Email</label>
          <input 
            type="email" 
            id="email" 
            placeholder="name@example.com"
            className="w-full bg-[#050505] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all"
          />
        </div>
        
        <div className="space-y-1">
          <label htmlFor="password" className="text-xs font-medium text-white/70 ml-1">Password</label>
          <input 
            type="password" 
            id="password" 
            placeholder="••••••••"
            className="w-full bg-[#050505] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all"
          />
        </div>

        <button 
          type="button" 
          className="w-full py-3 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 transition-all shadow-[0_4px_12px_rgba(255,255,255,0.1)] mt-2"
        >
          Create Account
        </button>
      </form>

      <div className="mt-8 text-center text-xs text-white/40">
        Already have an account?{' '}
        <Link to="/login" className="text-white hover:underline underline-offset-4">
          Sign in
        </Link>
      </div>
      
      <p className="mt-6 text-center text-[10px] text-white/30 max-w-xs mx-auto leading-relaxed">
        By clicking continue, you agree to our{' '}
        <Link to="/terms" className="hover:text-white transition-colors underline underline-offset-2">Terms of Service</Link>{' '}
        and{' '}
        <Link to="/privacy" className="hover:text-white transition-colors underline underline-offset-2">Privacy Policy</Link>.
      </p>
    </AuthLayout>
  );
}
