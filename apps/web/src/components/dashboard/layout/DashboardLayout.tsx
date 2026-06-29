import { ReactNode, useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Logo } from '../../landing/Logo';
import { CommandPalette } from '../shared/CommandPalette';
import {
  Home,
  FolderGit2,
  MonitorSmartphone,
  KeyRound,
  Activity,
  CreditCard,
  Settings,
  LogOut,
  Search,
  Menu,
  X,
  ShieldCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, firebaseSignOut } from '../../../lib/firebase';
import { useUserProfile } from '../../../hooks/useUserProfile';
import { User } from 'firebase/auth';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, profile, loading } = useUserProfile();

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

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

  const navigation = [
    { name: 'Overview', href: '/dashboard', icon: Home },
    { name: 'Projects', href: '/dashboard/projects', icon: FolderGit2 },
    { name: 'Devices', href: '/dashboard/devices', icon: MonitorSmartphone },
    { name: 'Sessions', href: '/dashboard/sessions', icon: ShieldCheck },
    { name: 'API Keys', href: '/dashboard/keys', icon: KeyRound },
    { name: 'Activity', href: '/dashboard/activity', icon: Activity },
  ];

  const secondaryNavigation = [
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
    { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
  ];

  const userPlan =
    profile?.role === 'pro'
      ? 'Pro Plan'
      : profile?.role === 'pro_trial'
        ? 'Pro Trial'
        : 'Community';

  const userInitial =
    profile?.name?.charAt(0)?.toUpperCase() || currentUser?.email?.charAt(0)?.toUpperCase() || '?';

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-white/20 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-60 border-r border-white/[0.06] bg-[#050505] fixed inset-y-0 z-20">
        <div className="h-16 flex items-center px-6 border-b border-white/[0.04]">
          <div className="flex items-center gap-3">
            <Logo className="w-5 h-5 text-white" />
            <span className="font-semibold tracking-tight text-sm">Derivo</span>
          </div>
        </div>

        <div className="p-4">
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors text-xs text-white/50 group"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5" />
              <span>Search...</span>
            </div>
            <kbd className="font-mono text-[9px] bg-white/[0.1] px-1.5 py-0.5 rounded text-white/40 group-hover:text-white/60 transition-colors">
              ⌘K
            </kbd>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2 px-3 flex flex-col gap-6">
          <nav className="flex flex-col gap-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  end={item.href === '/dashboard'}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${
                      isActive
                        ? 'bg-white/[0.06] text-white'
                        : 'text-white/50 hover:bg-white/[0.03] hover:text-white/80'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>

          <nav className="flex flex-col gap-1">
            <div className="px-3 text-[10px] font-mono uppercase tracking-wider text-white/30 mb-1">
              Configuration
            </div>
            {secondaryNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${
                      isActive
                        ? 'bg-white/[0.06] text-white'
                        : 'text-white/50 hover:bg-white/[0.03] hover:text-white/80'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </NavLink>
              );
            })}
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-red-400/85 hover:bg-red-500/10 hover:text-red-400 text-left w-full disabled:opacity-40 mt-1"
            >
              <LogOut className="w-4 h-4" />
              <span>{loggingOut ? 'Signing out...' : 'Sign Out'}</span>
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-white/[0.04]">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/[0.03] transition-all group">
            {currentUser?.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={profile?.name || 'User'}
                className="w-8 h-8 rounded-full border border-white/10 object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-sm font-semibold text-white/70 uppercase">
                {userInitial}
              </div>
            )}
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-medium text-white/90 truncate">
                {profile?.name || 'User'}
              </span>
              <span className="text-xs text-white/40 truncate">{userPlan}</span>
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              title="Sign out"
              className="p-1 rounded-lg text-white/30 hover:text-white/85 hover:bg-white/[0.05] transition-all disabled:opacity-40"
            >
              <LogOut className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[#050505]/80 backdrop-blur-md border-b border-white/[0.06] z-30 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Logo className="w-5 h-5 text-white" />
          <span className="font-semibold tracking-tight text-sm">Derivo</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-white/70 hover:text-white"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden fixed inset-0 z-20 bg-[#050505] pt-14 flex flex-col"
          >
            <div className="p-4">
              <button
                onClick={() => {
                  setIsCommandPaletteOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/50"
              >
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  <span>Search...</span>
                </div>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-6">
              <nav className="flex flex-col gap-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      end={item.href === '/dashboard'}
                      className={({ isActive }) => `
                        flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                        ${isActive ? 'bg-white/[0.06] text-white' : 'text-white/60'}
                      `}
                    >
                      <Icon className="w-5 h-5" />
                      {item.name}
                    </NavLink>
                  );
                })}
              </nav>
              <nav className="flex flex-col gap-1 border-t border-white/[0.06] pt-6">
                {secondaryNavigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      className={({ isActive }) => `
                        flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                        ${isActive ? 'bg-white/[0.06] text-white' : 'text-white/60'}
                      `}
                    >
                      <Icon className="w-5 h-5" />
                      {item.name}
                    </NavLink>
                  );
                })}
              </nav>

              {/* Mobile logout */}
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400/70 hover:text-red-400 hover:bg-white/[0.03] transition-colors disabled:opacity-40"
              >
                <LogOut className="w-5 h-5" />
                {loggingOut ? 'Signing out...' : 'Sign out'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 md:ml-60 min-h-screen pt-14 md:pt-0 relative overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto p-6 md:p-10">{children}</div>
        </div>
      </main>

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </div>
  );
}
