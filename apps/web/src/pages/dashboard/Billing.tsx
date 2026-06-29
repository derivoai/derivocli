import { useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/layout/DashboardLayout';
import { Zap, CreditCard, ArrowUpRight, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { billingApi } from '../../lib/api';
import { useApiQuery } from '../../hooks/useApi';
import { StatusBadge, type Tone } from '../../components/dashboard/shared/StatusBadge';
import { ErrorState, SkeletonList, RefreshButton } from '../../components/dashboard/shared/States';
import { formatDateTime } from '../../lib/relative-time';

const FEATURE_LABELS: Record<string, string> = {
  projects: 'Projects',
  devices: 'Devices',
  apiKeys: 'API Keys',
  plugins: 'Plugins',
  ai: 'AI Requests',
  storage: 'Storage (MB)',
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
      : state?.status === 'trialing'
        ? 'amber'
        : state?.status === 'grace'
          ? 'amber'
          : state?.active
            ? 'green'
            : 'red';

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 max-w-4xl">
        <header className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white mb-1">
              Billing &amp; Plans
            </h1>
            <p className="text-sm text-white/50">
              Plan, usage, and limits are computed by the backend and shown here.
            </p>
          </div>
          <RefreshButton onClick={refetchAll} busy={sub.loading || usage.loading} />
        </header>

        {upgradeNote && (
          <div className="px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{upgradeNote}</span>
          </div>
        )}

        {loading ? (
          <SkeletonList rows={2} />
        ) : sub.error ? (
          <ErrorState message={sub.error} onRetry={refetchAll} />
        ) : state ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Current plan */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/[0.08] flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5 text-amber-500" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-white/50">Current Subscription</span>
                  <span className="text-xl font-bold text-white tracking-tight">
                    {state.planLabel}
                  </span>
                </div>
                <div className="ml-auto">
                  <StatusBadge label={state.status} tone={statusTone} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs border-b border-white/[0.06] pb-4 mb-3">
                <Field label="Access">{state.active ? 'Premium' : 'Restricted'}</Field>
                <Field label="Plan">{state.planId}</Field>
                {state.isTrial && <Field label="Trial ends">{formatDateTime(state.endsAt)}</Field>}
                {!state.isTrial && state.renewalDate && (
                  <Field label="Renews">{formatDateTime(state.renewalDate)}</Field>
                )}
                {state.inGrace && <Field label="Grace until">{formatDateTime(state.endsAt)}</Field>}
              </div>

              {state.isTrial && state.active && (
                <div className="flex flex-col gap-2 mb-3">
                  <div className="flex justify-between text-xs text-white/60">
                    <span>Trial remaining</span>
                    <span className="font-medium text-amber-400">
                      {state.remainingDays}d {state.remainingHours % 24}h
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-white/[0.04] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (state.remainingDays / 3) * 100)}%` }}
                      className="h-full bg-amber-500"
                    />
                  </div>
                </div>
              )}

              <p className="text-xs text-white/50 leading-relaxed flex-1">{planBlurb(state)}</p>

              <div className="mt-6">
                <button
                  onClick={() =>
                    setUpgradeNote(
                      'Checkout is handled by the billing provider (Lemon Squeezy). Hosted checkout will be wired in a future phase.',
                    )
                  }
                  disabled={state.planId === 'pro' || state.planId === 'enterprise'}
                  className="w-full py-2.5 rounded-lg bg-white text-black text-xs font-semibold hover:bg-white/90 transition-colors disabled:bg-white/10 disabled:text-white/40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {state.planId === 'pro' || state.planId === 'enterprise'
                    ? 'Active Subscription'
                    : 'Upgrade to Pro'}
                </button>
              </div>
            </div>

            {/* Usage & limits */}
            <div className="p-6 rounded-2xl bg-white/[0.01] border border-white/[0.06] flex flex-col">
              <span className="text-sm font-medium text-white/90 mb-1">Usage &amp; Limits</span>
              <span className="text-xs text-white/50 mb-5">Live counts from the backend.</span>
              {usage.loading ? (
                <SkeletonList rows={3} />
              ) : usage.error ? (
                <ErrorState message={usage.error} onRetry={usage.refetch} />
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
            </div>
          </div>
        ) : null}

        {/* Billing portal placeholder */}
        <div className="p-6 rounded-2xl bg-white/[0.01] border border-white/[0.06] flex flex-col">
          <span className="text-sm font-medium text-white/90">Billing Portal</span>
          <span className="text-xs text-white/50 mt-1">
            Payments and invoices are managed by the billing provider.
          </span>
          <div className="flex-1 flex flex-col items-center justify-center py-8 border border-dashed border-white/[0.1] rounded-xl bg-white/[0.01] my-5">
            <CreditCard className="w-6 h-6 text-white/20 mb-2" />
            <span className="text-xs text-white/40">No payment method on file.</span>
          </div>
          <button
            disabled
            className="w-full py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.08] text-white/40 text-xs font-semibold cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            Manage Subscription <ArrowUpRight className="w-3.5 h-3.5 opacity-30" />
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}

function planBlurb(state: { planId: string; isTrial: boolean; active: boolean }): string {
  if (state.planId === 'pro' || state.planId === 'enterprise')
    return 'Your workspace is on a premium plan with unlimited projects, API keys, and devices.';
  if (state.isTrial && state.active)
    return 'Your premium trial is active. You have access to all Pro features until it ends.';
  return 'You are on the Free plan (or your trial has ended). Upgrade to unlock unlimited usage.';
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="text-white/40 block">{label}</span>
      <span className="font-semibold text-white capitalize">{children}</span>
    </div>
  );
}

function UsageRow({ label, used, limit }: { label: string; used: number; limit: number }) {
  const unlimited = limit === -1;
  const pct = unlimited ? 0 : Math.min(100, limit === 0 ? 100 : (used / limit) * 100);
  const near = !unlimited && pct >= 80;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-white/70">{label}</span>
        <span className="text-white/50 font-mono">
          {used}
          {unlimited ? ' / ∞' : ` / ${limit}`}
        </span>
      </div>
      <div className="h-1.5 w-full bg-white/[0.04] rounded-full overflow-hidden">
        <div
          className={`h-full ${unlimited ? 'bg-emerald-500/40' : near ? 'bg-red-500' : 'bg-white/40'}`}
          style={{ width: unlimited ? '100%' : `${pct}%` }}
        />
      </div>
    </div>
  );
}
