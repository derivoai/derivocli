import { useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/layout/DashboardLayout';
import {
  Plus,
  ArrowRight,
  Zap,
  Check,
  Terminal as TerminalIcon,
  Key,
  User,
  Activity as ActivityIcon,
  AlertTriangle,
  FolderGit2,
  MonitorSmartphone,
  BookOpen,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useDashboardOverview } from '../../hooks/useDashboardData';
import { isPremium, isTrialActive, getRemainingTrialTime } from '../../lib/subscription';
import { UpgradeModal } from '../../components/dashboard/shared/UpgradeModal';
import { PageHeader } from '../../components/dashboard/shared/PageHeader';
import { CommandLine } from '../../components/CommandLine';

export function DashboardHome() {
  const { profile, subscription, loading: profileLoading, error: profileError } = useUserProfile();
  const {
    projects,
    devices,
    activity,
    loading: dataLoading,
    error: dataError,
  } = useDashboardOverview();
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

  const trialDaysLeft = Math.floor(remainingTimeMs / (1000 * 60 * 60 * 24));
  const trialHoursLeft = Math.floor((remainingTimeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  const resolvedPlan = ((subscription as any)?.planId ?? subscription?.plan ?? '').toLowerCase();
  const resolvedStatus = ((subscription as any)?.status ?? '').toLowerCase();

  const userPlan =
    resolvedPlan === 'pro' || resolvedPlan === 'enterprise'
      ? resolvedPlan === 'enterprise'
        ? 'Enterprise'
        : 'Pro Plan'
      : resolvedPlan === 'trial' || resolvedStatus === 'trialing' || resolvedStatus === 'trial'
        ? trialActive
          ? 'Pro Trial'
          : 'Trial Expired'
        : 'Community Plan';

  const subStatus = resolvedStatus || 'inactive';

  const trialLabel =
    subscription?.plan === 'trial' && trialActive
      ? trialDaysLeft > 0
        ? `${trialDaysLeft}d ${trialHoursLeft}h left`
        : trialHoursLeft > 0
          ? `${trialHoursLeft}h left`
          : 'Less than 1 hour left'
      : `Status: ${subStatus}`;

  const trustedDevices = devices.filter((d) => d.isTrusted).length;

  const handleNewProjectClick = () => {
    if (!hasPremium) {
      setIsUpgradeModalOpen(true);
    }
    // else: project creation is CLI-driven — nothing to do from the web
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
        <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} />

        <PageHeader
          title={`Welcome back, ${profile?.name?.split(' ')[0] || 'there'}`}
          description="Here is what's happening with your workspace today."
          actions={
            <>
              <Link
                to="/docs"
                className="h-9 px-4 rounded-lg bg-white/[0.04] border border-white/[0.1] text-white text-xs font-medium hover:bg-white/[0.08] transition-colors flex items-center gap-2"
              >
                <BookOpen className="w-3.5 h-3.5" />
                Docs
              </Link>
              <button
                onClick={handleNewProjectClick}
                className="h-9 px-4 rounded-lg bg-white text-black text-xs font-semibold hover:bg-white/90 transition-colors flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                New Project
              </button>
            </>
          }
        />

        {/* Trial Expired Alert Banner */}
        {!hasPremium &&
          (resolvedPlan === 'trial' ||
            resolvedStatus === 'trialing' ||
            resolvedStatus === 'trial') && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold uppercase tracking-wider text-[10px] bg-red-500/20 px-2 py-0.5 rounded text-red-300">
                  Expired
                </span>
                <span>
                  Your premium trial has expired. Upgrade to Pro to continue creating projects and
                  using premium CLI endpoints.
                </span>
              </div>
              <button
                onClick={() => setIsUpgradeModalOpen(true)}
                className="text-xs font-semibold text-black bg-white hover:bg-white/95 px-3 py-1.5 rounded-lg transition-colors w-fit shrink-0"
              >
                Upgrade to Pro
              </button>
            </div>
          )}

        {/* Stat cards — real data */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            label="Subscription"
            value={userPlan}
            hint={trialLabel}
            icon={<Zap className="w-4 h-4 text-amber-400" />}
            to="/dashboard/billing"
            delay={0}
          />
          <StatCard
            label="Projects"
            value={String(projects.length)}
            hint={projects.length === 1 ? '1 project' : `${projects.length} projects`}
            icon={<FolderGit2 className="w-4 h-4 text-white/50" />}
            to="/dashboard/projects"
            delay={0.05}
          />
          <StatCard
            label="Devices"
            value={String(devices.length)}
            hint={`${trustedDevices} trusted`}
            icon={<MonitorSmartphone className="w-4 h-4 text-white/50" />}
            to="/dashboard/devices"
            delay={0.1}
          />
        </div>

        {/* Get started with the CLI — genuinely useful command reference */}
        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08]">
          <div className="flex items-center gap-2 mb-1">
            <TerminalIcon className="w-4 h-4 text-white/60" />
            <h2 className="text-sm font-semibold text-white">Get started with the CLI</h2>
          </div>
          <p className="text-xs text-white/45 mb-5">
            Install Derivo, authenticate this machine, then prepare any repository in seconds.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <Step n={1} label="Install">
              <CommandLine command="npm install -g derivo" />
            </Step>
            <Step n={2} label="Authenticate">
              <CommandLine command="derivo login" />
            </Step>
            <Step n={3} label="Set up a project">
              <CommandLine command="derivo setup" />
            </Step>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                projects.slice(0, 4).map((project) => (
                  <div
                    key={project.id}
                    className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.14] transition-colors flex items-center justify-between group"
                  >
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="text-sm font-medium text-white/90 truncate">
                        {project.name}
                      </span>
                      <span className="text-[11px] font-mono text-white/40">
                        {project.framework} • {project.env}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="items-center gap-2 hidden sm:flex">
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${project.status === 'synced' ? 'bg-emerald-500' : project.status === 'error' ? 'bg-red-500' : 'bg-amber-500'}`}
                        />
                        <span className="text-xs text-white/50 capitalize">{project.status}</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 rounded-xl border border-dashed border-white/[0.1] bg-white/[0.01] text-center">
                  <FolderGit2 className="w-8 h-8 text-white/20 mx-auto mb-3" />
                  <p className="text-sm font-medium text-white/70">No projects yet</p>
                  <p className="text-xs text-white/40 mt-1">
                    Run <span className="font-mono text-white/60">derivo setup</span> in a repository
                    to register your first project.
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
            <div className="p-5 rounded-xl border border-white/[0.08] bg-white/[0.02] flex flex-col gap-6">
              {activity.length > 0 ? (
                activity.map((act, i) => (
                  <div key={act.id} className="flex gap-4 relative">
                    {i !== activity.length - 1 && (
                      <div className="absolute left-[9px] top-6 bottom-[-24px] w-px bg-white/[0.08]" />
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
                <div className="py-6 text-center">
                  <ActivityIcon className="w-7 h-7 text-white/20 mx-auto mb-2" />
                  <p className="text-sm font-medium text-white/70">No recent activity</p>
                  <p className="text-xs text-white/40 mt-1">
                    Activity appears once you start using Derivo.
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

function StatCard({
  label,
  value,
  hint,
  icon,
  to,
  delay,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
  to: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Link
        to={to}
        className="block p-5 rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:bg-white/[0.04] hover:border-white/[0.14] transition-colors group"
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-medium text-white/50">{label}</span>
          {icon}
        </div>
        <div className="text-2xl font-semibold text-white tracking-tight truncate">{value}</div>
        <div className="text-xs text-white/40 mt-1 capitalize">{hint}</div>
      </Link>
    </motion.div>
  );
}

function Step({ n, label, children }: { n: number; label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="w-5 h-5 rounded-md bg-white/[0.06] border border-white/[0.08] text-[10px] font-mono text-white/50 flex items-center justify-center">
          {n}
        </span>
        <span className="text-xs font-medium text-white/60">{label}</span>
      </div>
      {children}
    </div>
  );
}
