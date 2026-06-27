import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { auth } from '../../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

export function Hero() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser: User | null) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <section className="relative z-10 w-full max-w-5xl mx-auto px-6 flex flex-col items-start justify-center pt-32 pb-16 md:pt-48 md:pb-24 text-left">
      <motion.h1
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="text-5xl md:text-8xl font-bold tracking-tight text-white max-w-4xl leading-[1.05]"
      >
        Your README <br />
        shouldn’t be <span className="text-white/40">400 lines</span>.
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="mt-8 text-xl text-white/50 max-w-2xl font-light leading-relaxed"
      >
        Derivo configures runtime versions, validates Docker daemons, and prepares local databases in seconds. No onboarding friction, no stale instructions. Just clone and start coding.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="mt-12 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto"
      >
        {user ? (
          <Link to="/dashboard" className="h-12 px-8 rounded-full bg-white text-black text-sm font-medium hover:bg-white/90 transition-all flex items-center justify-center gap-2 group shadow-[0_0_30px_rgba(255,255,255,0.15)] focus-visible:ring-2 focus-visible:ring-white">
            Dashboard
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        ) : (
          <Link to="/register" className="h-12 px-8 rounded-full bg-white text-black text-sm font-medium hover:bg-white/90 transition-all flex items-center justify-center gap-2 group shadow-[0_0_30px_rgba(255,255,255,0.15)] focus-visible:ring-2 focus-visible:ring-white">
            Get Started
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}
        <Link to="/docs" className="h-12 px-8 rounded-full bg-white/[0.03] text-white/80 border border-white/[0.08] text-sm font-medium hover:bg-white/[0.08] transition-all flex items-center justify-center gap-2 backdrop-blur-md focus-visible:ring-2 focus-visible:ring-white">
          View Documentation
        </Link>
      </motion.div>
    </section>
  );
}
