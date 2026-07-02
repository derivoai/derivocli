import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { auth } from '../../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { CommandLine } from '../CommandLine';
import { Logo } from './Logo';

const ease = [0.16, 1, 0.3, 1] as const;

export function Hero() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser: User | null) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <section className="relative z-10 w-full max-w-5xl mx-auto px-6 pt-32 pb-10 md:pt-44 md:pb-14">
      <div className="flex flex-col items-center text-center">
        {/* Glowing logo mark */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1, ease }}
          className="relative mb-8"
        >
          <div
            aria-hidden
            className="absolute -inset-6 rounded-full animate-glow-breathe"
            style={{
              background:
                'radial-gradient(circle, rgba(251,191,36,0.22) 0%, rgba(99,102,241,0.12) 50%, transparent 75%)',
              filter: 'blur(14px)',
            }}
          />
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="relative w-16 h-16 rounded-full bg-white/[0.04] border border-white/[0.12] backdrop-blur-sm flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
          >
            <Logo className="w-8 h-8 text-white" />
          </motion.div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 1.1, delay: 0.15, ease }}
          className="text-5xl md:text-7xl font-semibold tracking-tighter leading-[1.04] bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-transparent"
        >
          Any project. <br />
          One command.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.25, ease }}
          className="mt-7 text-lg md:text-xl text-white/50 max-w-xl font-light leading-relaxed"
        >
          Derivo configures runtimes, Docker, and databases in seconds. No 400-line READMEs. Just
          clone and start coding.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease }}
          className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto"
        >
          <Link
            to={user ? '/dashboard' : '/register'}
            className="h-12 px-8 rounded-full bg-white text-black text-sm font-medium hover:bg-white/90 transition-all hover:shadow-[0_0_40px_rgba(255,255,255,0.25)] flex items-center justify-center gap-2 group"
          >
            {user ? 'Dashboard' : 'Get Started'}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            to="/docs"
            className="h-12 px-8 rounded-full bg-transparent text-white/80 border border-white/[0.12] text-sm font-medium hover:bg-white/[0.05] hover:text-white hover:border-white/20 transition-colors flex items-center justify-center"
          >
            View Documentation
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.55, ease }}
          className="mt-10 flex flex-col items-center"
        >
          <CommandLine command="npm install -g derivo" variant="pill" />
          <p className="mt-3 text-xs text-white/30 font-mono">
            macOS, Linux &amp; Windows · Node 18+ · MIT licensed
          </p>
        </motion.div>
      </div>
    </section>
  );
}
