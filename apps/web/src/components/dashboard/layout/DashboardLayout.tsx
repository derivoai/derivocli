import { ReactNode, useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Logo } from '../../landing/Logo';
import { CommandPalette } from '../shared/CommandPalette';
import { LogOut, Search, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, firebaseSignOut } from '../../../lib/firebase';
import { useUserProfile } from '../../../hooks/useUserProfile';
import { getPlanLabel } from '../../../lib/subscription';
import { primaryNav, secondaryNav, type NavItem } from './nav';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, profile, subscription, loading } = useUserProfile();

  useEffect(() => setIsMobileMenuOpen(false), [location.pathname]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsCommandPaletteOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await firebaseSignOut(auth);
      navigate('/login');
    } catch (err) {
      console.error(err);
    } finally {
      setLoggingOut(false);
    }
  };

  const userPlan = getPlanLabel(subscription);
  const userInitial =
    profile?.name?.charAt(0)?.toUpperCase() || currentUser?.email?.charAt(0)?.toUpperCase() || '?';
  const showPhoto = !!currentUser?.photoURL && !avatarError;

  const NavRow = ({ item, mobile = false }: { item: NavItem; mobile?: boolean }) => {
    const Icon = item.icon;
    return (
      <NavLink
        to={item.href}
        end={item.end}
        className={({ isActive }) =>
          `group relative flex items-center gap-3 rounded-xl text-sm transition-all duration-200 ${
            mobile ? 'px-4 py-3' : 'px-3 py-2.5'
          } ${isActive ? 'bg-white/[0.07] text-white font-medium' : 'text-white/50 hover:bg-white/[0.04] hover:text-white/90'}`
        }
      >
        {({ isActive }) => (
          <>
            {isActive && (
              <motion.span
                layoutId={mobile ? undefined : 'nav-dot'}
                className="absolute -left-[13px] top-1/2 -translate-y-1/2 h-4 w-[3px] rounded-full bg-accent"
              />
            )}
            <Icon
              className={`w-[18px] h-[18px] transition-colors ${isActive ? 'text-accent-bright' : 'text-white/45 group-hover:text-white/70'}`}
            />
            {item.name}
          </>
        )}
      </NavLink>
    );
  };

  return (
    <div className="dashboard-mono min-h-screen bg-canvas text-white font-sans flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-[248px] border-r border-white/[0.06] bg-surface fixed inset-y-0 z-20">
        <div className="h-16 flex items-center px-5 border-b border-white/[0.05]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[14px] bg-white/[0.06] border border-white/10 flex items-center justify-center">
              <Logo className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-semibold tracking-tight text-[15px]">Derivo</span>
          </div>
        </div>

        <div className="px-4 pt-4">
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-canvas border border-white/[0.08] hover:border-white/[0.16] transition-colors text-xs text-white/45 group"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
            </div>
            <kbd className="font-mono text-[9px] bg-white/[0.07] px-1.5 py-0.5 rounded text-white/40">
              ⌘K
            </kbd>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto thin-scroll py-4 px-4 pl-[17px] flex flex-col gap-6">
          <nav className="flex flex-col gap-0.5">
            {primaryNav.map((item) => (
              <NavRow key={item.href} item={item} />
            ))}
          </nav>
          <nav className="flex flex-col gap-0.5">
            <div className="px-3 mb-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-white/30">
              Configuration
            </div>
            {secondaryNav.map((item) => (
              <NavRow key={item.href} item={item} />
            ))}
          </nav>
        </div>

        <div className="p-3 border-t border-white/[0.05]">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/[0.03] transition-colors">
            {showPhoto ? (
              <img
                src={currentUser!.photoURL as string}
                alt=""
                onError={() => setAvatarError(true)}
                className="w-9 h-9 rounded-full border border-white/10 object-cover shrink-0"
              />
            ) : (
              <div className="w-9 h-9 shrink-0 overflow-hidden rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-sm font-semibold leading-none text-white/70 uppercase">
                {userInitial}
              </div>
            )}
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-medium text-white/90 truncate">
                {profile?.name || 'User'}
              </span>
              {loading ? (
                <span className="mt-1 inline-block h-3 w-16 skeleton" />
              ) : (
                <span className="text-[11px] text-white/40 truncate">{userPlan}</span>
              )}
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              title="Sign out"
              className="p-1.5 rounded-lg text-white/35 hover:text-bad hover:bg-bad/10 transition-colors disabled:opacity-40"
            >
              <LogOut className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-surface/85 backdrop-blur-md border-b border-white/[0.06] z-30 flex items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center">
            <Logo className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-semibold tracking-tight text-sm">Derivo</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-white/70 hover:text-white"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden fixed inset-0 z-20 bg-canvas pt-14 flex flex-col"
          >
            <div className="p-4 flex flex-col gap-4">
              <button
                onClick={() => {
                  setIsCommandPaletteOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-3 rounded-xl bg-card border border-white/[0.07] text-sm text-white/50"
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </button>
              <nav className="flex flex-col gap-1">
                {primaryNav.map((item) => (
                  <NavRow key={item.href} item={item} mobile />
                ))}
              </nav>
              <nav className="flex flex-col gap-1 border-t border-white/[0.06] pt-4">
                {secondaryNav.map((item) => (
                  <NavRow key={item.href} item={item} mobile />
                ))}
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-bad/80 hover:text-bad hover:bg-bad/10 transition-colors disabled:opacity-40"
                >
                  <LogOut className="w-[18px] h-[18px]" />
                  {loggingOut ? 'Signing out...' : 'Sign out'}
                </button>
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main */}
      <main className="flex-1 md:ml-[248px] min-h-screen pt-14 md:pt-0 relative overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto thin-scroll relative aura">
          <div className="relative max-w-6xl mx-auto px-6 md:px-10 py-8 md:py-10 rise">
            {children}
          </div>
        </div>
      </main>

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </div>
  );
}
