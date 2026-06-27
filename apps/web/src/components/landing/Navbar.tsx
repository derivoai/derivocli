import { useState, useEffect } from 'react';
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'motion/react';
import { Logo } from './Logo';
import { cn } from '../../lib/utils';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { auth } from '../../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

export function Navbar() {
  const { scrollY } = useScroll();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser: User | null) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 20);
  });

  const navItems = [
    { name: 'Features', path: '/features' },
    { name: 'How it works', path: '/how-it-works' },
    { name: 'Pricing', path: '/pricing' },
    { name: 'Docs', path: '/docs' },
    { name: 'Blog', path: '/blog' }
  ];

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-[1000px] px-4"
    >
      <div
        className={cn(
          "flex items-center justify-between px-5 py-2.5 mx-auto rounded-full transition-all duration-500 relative z-50",
          isScrolled 
            ? "bg-[#111111]/80 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
            : "bg-[#111111]/40 backdrop-blur-md border border-white/5"
        )}
      >
        <Link to="/" className="flex items-center gap-3 pl-2 group" aria-label="Derivo Home">
          <Logo className="w-6 h-6 text-white group-hover:scale-105 transition-transform" />
          <span className="font-medium text-white tracking-tight">Derivo</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8" aria-label="Desktop navigation">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "text-[13px] font-medium transition-colors relative py-1 focus-visible:ring-1 focus-visible:ring-white rounded px-1.5",
                  isActive ? "text-white font-semibold" : "text-white/50 hover:text-white"
                )}
              >
                {item.name}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-1.5 right-1.5 h-px bg-white"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <Link 
              to="/dashboard" 
              className="px-5 py-2 rounded-full bg-white text-black text-[13px] font-semibold hover:bg-white/90 transition-colors shadow focus-visible:ring-2 focus-visible:ring-white"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link 
                to="/login" 
                className="hidden sm:block text-[13px] font-medium text-white/50 hover:text-white transition-colors px-3 focus-visible:ring-1 focus-visible:ring-white rounded"
              >
                Sign in
              </Link>
              <Link 
                to="/register" 
                className="hidden md:block px-5 py-2 rounded-full bg-white/[0.08] border border-white/[0.08] text-white text-[13px] font-medium hover:bg-white/[0.15] transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] focus-visible:ring-2 focus-visible:ring-white"
              >
                Get Started
              </Link>
            </>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 text-white/70 hover:text-white transition-colors focus-visible:ring-1 focus-visible:ring-white rounded-lg"
            aria-label="Toggle mobile menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
            className="absolute top-16 left-4 right-4 bg-[#111111]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col gap-4 shadow-2xl z-40 md:hidden"
          >
            <nav className="flex flex-col gap-3" aria-label="Mobile navigation">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "text-sm font-medium transition-colors py-2 px-3 rounded-lg block",
                      isActive ? "bg-white/10 text-white font-semibold" : "text-white/60 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="h-px bg-white/10 my-1" />
            <div className="flex flex-col gap-3">
              {user ? (
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-lg bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors shadow"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 rounded-lg text-white/70 hover:text-white transition-colors text-sm font-medium border border-white/5 bg-white/[0.02]"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 rounded-lg bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors shadow"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
