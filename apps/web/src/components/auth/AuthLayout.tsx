import { ReactNode } from 'react';
import { motion } from 'motion/react';
import { Background } from '../landing/Background';
import { Logo } from '../landing/Logo';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen bg-[#050505] overflow-hidden flex flex-col items-center justify-center font-sans text-white selection:bg-white/20">
      <Background />
      
      <Link to="/" className="absolute top-8 left-8 md:top-12 md:left-12 z-20 group">
        <Logo className="w-8 h-8 text-white/70 group-hover:text-white transition-colors" />
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10 px-6"
      >
        <div className="rounded-3xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-2xl border border-white/[0.08] p-8 md:p-10 shadow-[0_30px_60px_-15px_rgba(255,255,255,0.02),inset_0_1px_0_rgba(255,255,255,0.05)]">
          <div className="text-center mb-10">
            <h1 className="text-2xl font-bold tracking-tight text-white mb-2">{title}</h1>
            <p className="text-sm text-white/50">{subtitle}</p>
          </div>
          
          {children}
        </div>
      </motion.div>
    </div>
  );
}
