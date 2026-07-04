import { useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/layout/DashboardLayout';
import { Zap, CreditCard, ArrowUpRight, AlertTriangle } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { billingApi } from '../../lib/api';
import { useApiQuery } from '../../hooks/useApi';
import { StatusBadge, type Tone } from '../../components/dashboard/shared/StatusBadge';
import { ErrorState, SkeletonList, RefreshButton } from '../../components/dashboard/shared/States';
import { PageHeader } from '../../components/dashboard/shared/PageHeader';
import { Card, Section, Btn, IconTile } from '../../components/dashboard/ui/kit';
import { formatDateTime } from '../../lib/relative-time';

const FEATURE_LABELS: Record<string, string> = {
  projects: 'Projects',
  devices: 'Devices',
  apiKeys: 'API Keys',
  plugins: 'Plugins',
  ai: 'AI Requests',
  storage: 'Storage (MB)',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  trialing: 'Trial',
  grace: 'Grace period',
  expired: 'Expired',
  canceled: 'Canceled',
  inactive: 'Inactive',
};

export function Billing() {
  const sub = useApiQuery(() => billingApi.subscription(), []);
  const usage = useApiQuery(() => billingApi.usage(), []);
  const [upgradeNote, setUpgradeNote] = useState('');

  const refetchAll = () => {
    sub.refetch();
    usage.refetch();
  };

  const loading = sub.loading;
  const state = sub.data;

  const statusTone: Tone =
    state?.status === 'active'
      ? 'green'
      : state?.status === 'trialing' || state?.status === 'grace'
        ? 'amber'
        : state?.active
          ? 'green'
          : 'red';

  const isPaid = state?.planId === 'pro' || state?.planId === 'enterprise';

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 max-w-4xl">
        <PageHeader
          eyebrow="Account"
          title="Billing & Plans"
          description="Plan, usage, and limits are computed by the backend and shown here."
          actions={<RefreshButton onClick={refetchAll} busy={sub.loading || usage.loading} />}
        />

        {upgradeNote && (
          <Card className="p-4 !border-warn/20 text-xs text-warn flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{upgradeNote}</span>
          </Card>
        )}

        {loading ? (
          <SkeletonList rows={2} />
        ) : sub.error ? (
          <ErrorState message={sub.error} onRetry={refetchAll} />
        ) : state ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Current plan */}
            <Card className="p-6 flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <IconTile tone="accent" size="lg">
                  <Zap className="w-5 h-5" />
                </IconTile>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-white/50">Current Subscription</span>
                  <span className="text-xl font-semibold text-white tracking-tight">
                    {state.planLabel}
                  </span>
                </div>
                <div className="ml-auto">
                  <StatusBadge
                    label={STATUS_LABELS[state.status] ?? state.status}
                    tone={statusTone}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs border-b border-white/[0.06] pb-4 mb-3">
                <FieldRow label="Access">{state.active ? 'Premium' : 'Restricted'}</FieldRow>
                <FieldRow label="Plan">{state.planId}</FieldRow>
                {state.isTrial && (
                  <FieldRow label="Trial ends">{formatDateTime(state.endsAt)}</FieldRow>
                )}
                {!state.isTrial && state.renewalDate && (
                  <FieldRow label="Renews">{formatDateTime(state.renewalDate)}</FieldRow>
                )}
                {state.inGrace && (
                  <FieldRow label="Grace until">{formatDateTime(state.endsAt)}</FieldRow>
                )}
              </div>

              {state.isTrial && state.active && (
                <TrialBar
                  remainingDays={state.remainingDays}
                  remainingHours={state.remainingHours}
                />
              )}

              <p className="text-xs text-white/50 leading-relaxed flex-1">{planBlurb(state)}</p>

              <div className="mt-6">
                <Btn
                  variant={isPaid ? 'secondary' : 'accent'}
                  onClick={() =>
                    setUpgradeNote(
                      'Checkout is handled by the billing provider (Lemon Squeezy). Hosted checkout will be wired in a future phase.',
                    )
                  }
                  disabled={isPaid}
                  className="w-full h-11"
                >
                  {isPaid ? 'Active Subscription' : 'Upgrade to Pro'}
                </Btn>
              </div>
            </Card>

            {/* Usage & limits */}
            <Section title="Usage & Limits">
              <p className="text-xs text-white/45 -mt-1 mb-5">Live counts from the backend.</p>
              {usage.loading ? (
                <SkeletonList rows={3} />
              ) : usage.error ? (
                <ErrorState message={usage.error} onRetry={usage.refetch} />
              ) : Object.keys(usage.data?.usage ?? {}).length === 0 ? (
                <p className="text-xs text-white/40 py-6 text-center">
                  No usage data available yet.
                </p>
              ) : (
                <div className="flex flex-col gap-4">
                  {Object.entries(usage.data?.usage ?? {}).map(([feature, u]) => (
                    <UsageRow
                      key={feature}
                      label={FEATURE_LABELS[feature] ?? feature}
                      used={u.used}
                      limit={u.limit}
                    />
                  ))}
                </div>
              )}
            </Section>
          </div>
        ) : null}

        <Section title="Billing Portal">
          <p className="text-xs text-white/45 -mt-1">
            Payments and invoices are managed by the billing provider.
          </p>
          <div className="flex-1 flex flex-col items-center justify-center py-8 border border-dashed border-white/[0.1] rounded-xl bg-white/[0.01] my-5">
            <CreditCard className="w-6 h-6 text-white/20 mb-2" />
            <span className="text-xs text-white/40">No payment method on file.</span>
          </div>
          <Btn variant="secondary" disabled className="w-full h-11">
            Manage Subscription <ArrowUpRight className="w-3.5 h-3.5 opacity-40" />
          </Btn>
        </Section>
      </div>
    </DashboardLayout>
  );
}

function TrialBar({
  remainingDays,
  remainingHours,
}: {
  remainingDays: number;
  remainingHours: number;
}) {
  const reduce = useReducedMotion();
  const pct = Math.min(100, (remainingDays / 3) * 100);
  return (
    <div className="flex flex-col gap-2 mb-3">
      <div className="flex justify-between text-xs text-white/60">
        <span>Trial remaining</span>
        <span className="font-medium text-warn">
          {remainingDays}d {remainingHours % 24}h
        </span>
      </div>
      <div className="h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden">
        <motion.div
          initial={reduce ? false : { width: 0 }}
          animate={{ width: `${pct}%` }}
          className="h-full bg-warn"
        />
      </div>
    </div>
  );
}

function planBlurb(state: { planId: string; isTrial: boolean; active: boolean }): string {
  if (state.planId === 'pro' || state.planId === 'enterprise')
    return 'Your workspace is on a premium plan with unlimited projects, API keys, and devices.';
  if (state.isTrial && state.active)
    return 'Your premium trial is active. You have access to all Pro features until it ends.';
  return 'You are on the Community plan (or your trial has ended). Upgrade to unlock unlimited usage.';
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="text-white/40 block">{label}</span>
      <span className="font-semibold text-white capitalize">{children}</span>
    </div>
  );
}

function UsageRow({ label, used, limit }: { label: string; used: number; limit: number }) {
  const unlimited = limit === -1;
  const notApplicable = limit === 0;
  const pct = unlimited || notApplicable ? 0 : Math.min(100, (used / limit) * 100);
  const near = !unlimited && !notApplicable && pct >= 80 && pct < 100;
  const over = !unlimited && !notApplicable && pct >= 100;

  const barColor = unlimited
    ? 'bg-good/50'
    : notApplicable
      ? 'bg-white/10'
      : over
        ? 'bg-bad'
        : near
          ? 'bg-warn'
          : 'bg-accent/60';
  const barWidth = unlimited ? '100%' : notApplicable ? '0%' : `${pct}%`;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-white/70">{label}</span>
        <span className="text-white/50 font-mono">
          {used}
          {unlimited ? ' / ∞' : notApplicable ? ' / —' : ` / ${limit}`}
        </span>
      </div>
      <div className="h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden">
        <div className={`h-full ${barColor}`} style={{ width: barWidth }} />
      </div>
    </div>
  );
}
