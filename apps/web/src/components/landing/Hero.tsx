import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Check, Terminal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { auth } from '../../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { CommandLine } from '../CommandLine';

const handles = [
  'Runtime versions from .nvmrc',
  'Docker engine & containers',
  'Databases, schemas & seeds',
  'Port conflicts & stale processes',
  'Missing .env values',
];

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
    <section className="relative z-10 w-full max-w-6xl mx-auto px-6 pt-32 pb-16 md:pt-44 md:pb-24">
      <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-12 lg:gap-10 items-center">
        {/* Left: headline + CTAs */}
        <div className="flex flex-col items-start text-left">
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease }}
            className="text-4xl md:text-6xl font-bold tracking-tight text-white leading-[1.05]"
          >
            Your README <br />
            shouldn’t be <span className="text-white/35">400 lines</span>.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.15, ease }}
            className="mt-7 text-lg text-white/60 max-w-xl font-light leading-relaxed"
          >
            Derivo configures runtime versions, validates Docker daemons, and prepares local
            databases in seconds. No onboarding friction, no stale instructions. Just clone and
            start coding.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.25, ease }}
            className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto"
          >
            {user ? (
              <Link
                to="/dashboard"
                className="h-12 px-8 rounded-full bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors flex items-center justify-center gap-2 group"
              >
                Dashboard
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            ) : (
              <Link
                to="/register"
                className="h-12 px-8 rounded-full bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors flex items-center justify-center gap-2 group"
              >
                Get Started
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            )}
            <Link
              to="/docs"
              className="h-12 px-8 rounded-full bg-transparent text-white/80 border border-white/[0.12] text-sm font-medium hover:bg-white/[0.05] hover:text-white hover:border-white/20 transition-colors flex items-center justify-center gap-2"
            >
              View Documentation
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.35, ease }}
            className="mt-8 w-full sm:w-auto"
          >
            <CommandLine command="npm install -g derivo" variant="pill" className="w-full sm:w-auto" />
            <p className="mt-3 text-xs text-white/35 font-mono">
              macOS, Linux &amp; Windows · Node 18+ · MIT licensed
            </p>
          </motion.div>
        </div>

        {/* Right: what `derivo setup` handles */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease }}
          className="hidden lg:block rounded-2xl bg-white/[0.02] border border-white/[0.08] p-7"
        >
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-white/40 mb-6">
            <Terminal className="w-3.5 h-3.5" />
            derivo setup handles
          </div>
          <ul className="flex flex-col gap-4">
            {handles.map((item, i) => (
              <motion.li
                key={item}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.5 + i * 0.08, ease }}
                className="flex items-center gap-3 text-sm text-white/75"
              >
                <span className="w-5 h-5 rounded-full bg-white/[0.04] border border-white/[0.1] flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-emerald-300/80" />
                </span>
                {item}
              </motion.li>
            ))}
          </ul>
          <div className="mt-7 pt-5 border-t border-white/[0.08] flex items-center justify-between">
            <span className="text-xs text-white/40">One command. Fully verified.</span>
            <span className="text-xs font-mono text-white/55">~30s</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
