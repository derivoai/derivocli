import { useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/layout/DashboardLayout';
import {
  Plus,
  Terminal,
  ArrowRight,
  Zap,
  CheckCircle2,
  Check,
  Terminal as TerminalIcon,
  Key,
  User,
  Activity as ActivityIcon,
  AlertTriangle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useDashboardOverview } from '../../hooks/useDashboardData';
import { isPremium, isTrialActive, getRemainingTrialTime } from '../../lib/subscription';
import { UpgradeModal } from '../../components/dashboard/shared/UpgradeModal';

export function DashboardHome() {
  const { profile, subscription, loading: profileLoading, error: profileError } = useUserProfile();
  const { projects, devices, activity, loading: dataLoading, error: dataError } = useDashboardOverview();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const error = profileError || dataError;

  if (profileLoading || dataLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white/80 animate-spin" />
            <span className="text-xs text-white/40 font-mono">Loading dashboard data...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="flex flex-col items-center gap-4 text-center px-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <span className="text-sm text-white/60">{error}</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const hasPremium = subscription ? isPremium(subscription) : false;
  const trialActive = subscription ? isTrialActive(subscription) : false;
  const remainingTimeMs = subscription ? getRemainingTrialTime(subscription) : 0;
  
  // Calculate remaining days
  const trialDaysLeft = Math.ceil(remainingTimeMs / (1000 * 60 * 60 * 24));

  const userPlan = subscription?.plan === 'pro'
    ? 'Pro Plan'
    : subscription?.plan === 'trial'
      ? (trialActive ? 'Pro Trial' : 'Trial Expired')
      : 'Community Plan';

  const subStatus = subscription?.status || 'inactive';

  const handleNewProjectClick = () => {
    if (!hasPremium) {
      setIsUpgradeModalOpen(true);
    } else {
      // Allow or redirect to creation flow
      setIsUpgradeModalOpen(true); // Since Stripe isn't integrated yet, treat as prompt
    }
  };

  const getActivityIcon = (iconName: string) => {
    const props = { className: 'w-4 h-4 text-white/70' };
    switch (iconName) {
      case 'check':
        return <Check {...props} />;
      case 'terminal':
        return <TerminalIcon {...props} />;
      case 'key':
        return <Key {...props} />;
      case 'user':
        return <User {...props} />;
      case 'zap':
        return <Zap className="w-4 h-4 text-amber-400" />;
      default:
        return <ActivityIcon {...props} />;
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        
        {/* Upgrade Modal */}
        <UpgradeModal
          isOpen={isUpgradeModalOpen}
          onClose={() => setIsUpgradeModalOpen(false)}
        />

        {/* Welcome Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">
              Welcome back, {profile?.name?.split(' ')[0] || 'User'}
            </h1>
            <p className="text-sm text-white/50">
              Here is what's happening with your workspace today.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="h-9 px-4 rounded-lg bg-white/[0.05] border border-white/[0.08] text-white text-xs font-medium hover:bg-white/[0.1] transition-colors flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5" />
              Install CLI
            </button>
            <button
              onClick={handleNewProjectClick}
              className="h-9 px-4 rounded-lg bg-white text-black text-xs font-semibold hover:bg-white/90 transition-colors flex items-center gap-2 shadow-[0_2px_8px_rgba(255,255,255,0.15)]"
            >
              <Plus className="w-3.5 h-3.5" />
              New Project
            </button>
          </div>
        </header>

        {/* Trial Expired Alert Banner */}
        {!hasPremium && subscription?.plan === 'trial' && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_4px_20px_rgba(239,68,68,0.05)]">
            <div className="flex items-center gap-2">
              <span className="font-semibold uppercase tracking-wider text-[10px] bg-red-500/20 px-2 py-0.5 rounded text-red-300">
                Expired
              </span>
              <span>Your premium trial has expired. Upgrade to Pro to continue creating projects and using premium CLI endpoints.</span>
            </div>
            <button
              onClick={() => setIsUpgradeModalOpen(true)}
              className="text-xs font-semibold text-black bg-white hover:bg-white/95 px-3 py-1.5 rounded-lg transition-colors w-fit shrink-0 shadow-sm"
            >
              Upgrade to Pro
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Status Card 1: Subscription */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-2xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/[0.06] flex flex-col gap-4 relative overflow-hidden group"
          >
            <div className="flex items-center justify-between relative z-10">
              <span className="text-xs font-medium text-white/50">Subscription Status</span>
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <div className="relative z-10">
              <div className="text-2xl font-semibold text-white tracking-tight">{userPlan}</div>
              <div className="text-xs text-white/40 mt-1 flex items-center gap-1.5 capitalize">
                Status: {subStatus}
              </div>
              {subscription?.plan === 'trial' && trialActive && (
                <div className="text-xs text-white/40 mt-1">
                  Trial Remaining: {trialDaysLeft} {trialDaysLeft === 1 ? 'day' : 'days'}
                </div>
              )}
            </div>
            <div className="absolute right-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <Link
                to="/dashboard/billing"
                className="text-[10px] text-white/40 hover:text-white flex items-center gap-1 uppercase tracking-wider font-mono"
              >
                Billing <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </motion.div>

          {/* Status Card 2: Active Projects */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-white/50">Active Projects</span>
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            </div>
            <div>
              <div className="text-2xl font-semibold text-white tracking-tight">
                {projects.length}
              </div>
              <div className="text-xs text-white/40 mt-1">Across {devices.length} environments</div>
            </div>
          </motion.div>

          {/* Status Card 3: Environment Health */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-white/50">Environment Health</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <div className="text-2xl font-semibold text-white tracking-tight">Optimal</div>
              <div className="text-xs text-white/40 mt-1">All systems operational</div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
          {/* Recent Projects */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white/90">Recent Projects</h2>
              <Link
                to="/dashboard/projects"
                className="text-xs text-white/40 hover:text-white transition-colors font-medium"
              >
                View all
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              {projects.length > 0 ? (
                projects.slice(0, 3).map((project) => (
                  <div
                    key={project.id}
                    className="p-4 rounded-xl border border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.03] transition-colors flex items-center justify-between group"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-white/90">{project.name}</span>
                      <span className="text-[11px] font-mono text-white/40">
                        {project.framework} • {project.env}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 hidden sm:flex">
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${project.status === 'synced' ? 'bg-emerald-500' : project.status === 'error' ? 'bg-red-500' : 'bg-amber-500'}`}
                        />
                        <span className="text-xs text-white/50 capitalize">{project.status}</span>
                      </div>
                      <button className="text-white/30 group-hover:text-white transition-colors p-1">
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-white/40">
                  <p className="text-sm font-medium">No projects yet</p>
                  <p className="text-xs text-white/30 mt-1">
                    Install the Derivo CLI to create your first project.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white/90">Activity</h2>
              <Link
                to="/dashboard/activity"
                className="text-xs text-white/40 hover:text-white transition-colors font-medium"
              >
                View log
              </Link>
            </div>
            <div className="p-5 rounded-xl border border-white/[0.05] bg-white/[0.01] flex flex-col gap-6">
              {activity.length > 0 ? (
                activity.map((act, i) => (
                  <div key={act.id} className="flex gap-4 relative">
                    {i !== activity.length - 1 && (
                      <div className="absolute left-[9px] top-6 bottom-[-24px] w-px bg-white/[0.05]" />
                    )}
                    <div className="w-5 h-5 rounded-full bg-[#0a0a0a] border border-white/[0.1] flex items-center justify-center shrink-0 mt-0.5 z-10">
                      {getActivityIcon(act.icon)}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-white/80">{act.event}</span>
                      <span className="text-[11px] text-white/40 mt-0.5 leading-relaxed">
                        {act.description}
                      </span>
                      <span className="text-[10px] text-white/30 mt-1">{act.timestamp}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-white/40">
                  <p className="text-sm font-medium">No recent activity</p>
                  <p className="text-xs text-white/30 mt-1">
                    Activity will appear here once you start using Derivo.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
