/**
 * Single source of truth for dashboard navigation. Both the sidebar and the
 * command palette read from this so their destinations never drift.
 */
import {
  Home,
  FolderGit2,
  MonitorSmartphone,
  ShieldCheck,
  KeyRound,
  Activity,
  Settings,
  CreditCard,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  end?: boolean;
}

export const primaryNav: NavItem[] = [
  { name: 'Overview', href: '/dashboard', icon: Home, end: true },
  { name: 'Projects', href: '/dashboard/projects', icon: FolderGit2 },
  { name: 'Devices', href: '/dashboard/devices', icon: MonitorSmartphone },
  { name: 'Sessions', href: '/dashboard/sessions', icon: ShieldCheck },
  { name: 'API Keys', href: '/dashboard/keys', icon: KeyRound },
  { name: 'Activity', href: '/dashboard/activity', icon: Activity },
];

export const secondaryNav: NavItem[] = [
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
];

export const allNav: NavItem[] = [...primaryNav, ...secondaryNav];
