import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X } from 'lucide-react';
import { Logo } from '../landing/Logo';
import { auth } from '../../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { cn } from '../../lib/utils';

const links = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Docs', href: '/docs' },
];

export function LightNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    return onAuthStateChanged(auth, setUser);
  }, []);

  const renderLink = (l: (typeof links)[number], onClick?: () => void, mobile = false) => {
    const base = mobile
      ? 'block py-2 text-base text-foreground'
      : 'text-sm text-muted-foreground hover:text-foreground transition-colors';
    return l.href.startsWith('#') ? (
      <a key={l.label} href={l.href} onClick={onClick} className={base}>
        {l.label}
      </a>
    ) : (
      <Link key={l.label} to={l.href} onClick={onClick} className={base}>
        {l.label}
      </Link>
    );
  };

  return (
    <header
      className={cn(
        'lightui sticky top-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-background/90 backdrop-blur-xl border-b border-border shadow-[0_1px_20px_-8px_rgba(0,0,0,0.12)]'
          : 'bg-background/60 backdrop-blur-md border-b border-transparent',
      )}
    >
      <div className="flex items-center justify-between px-6 md:px-12 lg:px-20 py-4">
        <Link to="/" className="flex items-center gap-2.5 text-foreground">
          <Logo className="w-7 h-7" />
          <span className="text-xl font-semibold tracking-tight">Derivo</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">{links.map((l) => renderLink(l))}</nav>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <Link
              to="/dashboard"
              className="rounded-full bg-primary text-primary-foreground px-5 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-primary text-primary-foreground px-5 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Install CLI
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="md:hidden h-9 w-9 flex items-center justify-center rounded-lg text-foreground hover:bg-secondary transition-colors"
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden overflow-hidden border-t border-border bg-background"
          >
            <div className="px-6 py-4 flex flex-col">
              {links.map((l) => renderLink(l, () => setOpen(false), true))}
              <div className="mt-4 flex flex-col gap-2">
                {user ? (
                  <Link
                    to="/dashboard"
                    onClick={() => setOpen(false)}
                    className="w-full text-center rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium"
                  >
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setOpen(false)}
                      className="w-full text-center rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground"
                    >
                      Sign in
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setOpen(false)}
                      className="w-full text-center rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium"
                    >
                      Install CLI
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
