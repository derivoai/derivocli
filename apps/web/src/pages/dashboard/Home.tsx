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
  FolderGit2,
  MonitorSmartphone,
  BookOpen,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useDashboardOverview } from '../../hooks/useDashboardData';
import {
  isPremium,
  isTrialActive,
  getRemainingTrialTime,
  getPlanLabel,
} from '../../lib/subscription';
import { UpgradeModal } from '../../components/dashboard/shared/UpgradeModal';
import { PageHeader } from '../../components/dashboard/shared/PageHeader';
import { ErrorState, SkeletonCards } from '../../components/dashboard/shared/States';
import { StatusBadge, type Tone } from '../../components/dashboard/shared/StatusBadge';
import { CommandLine } from '../../components/CommandLine';
import { Card, Section, Btn, IconTile, SectionLabel } from '../../components/dashboard/ui/kit';

const statusTone = (s: string): Tone =>
  s === 'synced' ? 'green' : s === 'error' ? 'red' : 'amber';

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
        <div className="flex flex-col gap-8">
          <div className="h-10 w-64 bg-secondary animate-pulse rounded-lg" />
          <SkeletonCards count={3} />
          <div className="h-44 bg-secondary animate-pulse rounded-[14px]" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <ErrorState message={error} />
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
  const userPlan = getPlanLabel(subscription);
  const isTrialTier =
    resolvedPlan === 'trial' || resolvedStatus === 'trialing' || resolvedStatus === 'trial';

  const trialLabel =
    isTrialTier && trialActive
      ? trialDaysLeft > 0
        ? `${trialDaysLeft}d ${trialHoursLeft}h left`
        : trialHoursLeft > 0
          ? `${trialHoursLeft}h left`
          : 'Less than 1 hour left'
      : `Status: ${resolvedStatus || 'inactive'}`;

  const trustedDevices = devices.filter((d) => d.isTrusted).length;
  const handleNewProjectClick = () => {
    if (!hasPremium) setIsUpgradeModalOpen(true);
  };

  const getActivityIcon = (iconName: string) => {
    const props = { className: 'w-3.5 h-3.5 text-muted-foreground' };
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
        return <Zap className="w-3.5 h-3.5 text-amber-600" />;
      default:
        return <ActivityIcon {...props} />;
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} />

        <PageHeader
          eyebrow="Workspace"
          title={`Welcome back, ${profile?.name?.split(' ')[0] || 'there'}`}
          description="Environment status and recent activity across your account."
          actions={
            <>
              <Link
                to="/docs"
                className="inline-flex items-center gap-2 h-9 px-4 text-[13px] font-medium rounded-[10px] bg-background text-foreground hover:bg-secondary border border-border transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" />
                Docs
              </Link>
              <Btn
                variant="accent"
                onClick={handleNewProjectClick}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                New Project
              </Btn>
            </>
          }
        />

        {!hasPremium && isTrialTier && (
          <Card className="p-4 !border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-sm">
              <StatusBadge label="Expired" tone="red" />
              <span className="text-muted-foreground">
                Your premium trial has expired. Upgrade to keep creating projects.
              </span>
            </div>
            <Btn
              variant="secondary"
              size="sm"
              onClick={() => setIsUpgradeModalOpen(true)}
              className="shrink-0"
            >
              Upgrade
            </Btn>
          </Card>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            label="Subscription"
            value={userPlan}
            hint={trialLabel}
            icon={<Zap className="w-4 h-4" />}
            tone="accent"
            to="/dashboard/billing"
          />
          <StatCard
            label="Projects"
            value={String(projects.length)}
            hint={`${projects.length} registered`}
            icon={<FolderGit2 className="w-4 h-4" />}
            tone="neutral"
            to="/dashboard/projects"
          />
          <StatCard
            label="Devices"
            value={String(devices.length)}
            hint={`${trustedDevices} trusted`}
            icon={<MonitorSmartphone className="w-4 h-4" />}
            tone="neutral"
            to="/dashboard/devices"
          />
        </div>

        {/* CLI quickstart */}
        <Section title="Get started with the CLI">
          <p className="text-sm text-muted-foreground -mt-1 mb-5">
            Install Derivo, authenticate this machine, then prepare any repository in seconds.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
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
        </Section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent projects */}
          <div className="lg:col-span-2">
            <Section
              title="Recent Projects"
              flush
              actions={
                <Link
                  to="/dashboard/projects"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  View all
                </Link>
              }
            >
              {projects.length > 0 ? (
                <div className="divide-y divide-border">
                  {projects.slice(0, 4).map((project) => (
                    <Link
                      key={project.id}
                      to="/dashboard/projects"
                      className="group flex items-center justify-between px-6 py-4 hover:bg-secondary transition-colors"
                    >
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="text-sm font-medium text-foreground truncate">
                          {project.name}
                        </span>
                        <span className="text-[11px] font-mono text-muted-foreground">
                          {project.framework} · {project.env}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="hidden sm:block">
                          <StatusBadge label={project.status} tone={statusTone(project.status)} />
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="px-6 py-10 text-center">
                  <FolderGit2 className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium text-foreground">No projects yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Run <span className="font-mono text-muted-foreground">derivo setup</span> to
                    register your first project.
                  </p>
                </div>
              )}
            </Section>
          </div>

          {/* Activity */}
          <Section
            title="Activity"
            actions={
              <Link
                to="/dashboard/activity"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                View log
              </Link>
            }
          >
            {activity.length > 0 ? (
              <div className="flex flex-col gap-5">
                {activity.map((act, i) => (
                  <div key={act.id} className="flex gap-3.5 relative">
                    {i !== activity.length - 1 && (
                      <div className="absolute left-[13px] top-7 bottom-[-20px] w-px bg-border" />
                    )}
                    <div className="w-7 h-7 rounded-lg bg-background border border-border flex items-center justify-center shrink-0 z-10">
                      {getActivityIcon(act.icon)}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-foreground">{act.event}</span>
                      <span className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                        {act.description}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground mt-1">
                        {act.timestamp}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center">
                <ActivityIcon className="w-7 h-7 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">No recent activity</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Activity appears once you start using Derivo.
                </p>
              </div>
            )}
          </Section>
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
  tone,
  to,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
  tone: 'accent' | 'neutral';
  to: string;
}) {
  return (
    <Link to={to}>
      <Card hover className="p-5">
        <div className="flex items-center justify-between mb-6">
          <SectionLabel>{label}</SectionLabel>
          <IconTile tone={tone} size="sm">
            {icon}
          </IconTile>
        </div>
        <div className="text-[26px] font-semibold text-foreground tracking-[-0.01em] truncate">
          {value}
        </div>
        <div className="text-xs text-muted-foreground mt-1 capitalize">{hint}</div>
      </Card>
    </Link>
  );
}

function Step({ n, label, children }: { n: number; label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="w-5 h-5 rounded-md bg-secondary border border-border text-[10px] font-mono text-muted-foreground flex items-center justify-center">
          {n}
        </span>
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      {children}
    </div>
  );
}
