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
    <div className="lightui relative min-h-screen bg-background overflow-hidden flex flex-col items-center justify-center font-sans text-foreground selection:bg-accent/20">
      <Background />

      <Link to="/" className="absolute top-8 left-8 md:top-12 md:left-12 z-20 group">
        <Logo className="w-8 h-8 text-muted-foreground group-hover:text-foreground transition-colors" />
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10 px-6"
      >
        <div className="rounded-3xl bg-background border border-border p-8 md:p-10 shadow-xl shadow-foreground/5">
          <div className="text-center mb-10">
            <h1 className="text-2xl font-bold tracking-tight text-foreground mb-2">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>

          {children}
        </div>
      </motion.div>
    </div>
  );
}
