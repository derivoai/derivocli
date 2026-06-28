import { useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/layout/DashboardLayout';
import { Zap, CreditCard, Download, ArrowUpRight, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { useUserProfile } from '../../hooks/useUserProfile';
import { isPremium, isTrialActive, getRemainingTrialTime } from '../../lib/subscription';

export function Billing() {
  const { subscription, loading, error: profileError } = useUserProfile();
  const [upgradeError, setUpgradeError] = useState('');

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white/80 animate-spin" />
            <span className="text-xs text-white/40 font-mono">Loading billing details...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const hasPremium = subscription ? isPremium(subscription) : false;
  const trialActive = subscription ? isTrialActive(subscription) : false;
  const remainingTimeMs = subscription ? getRemainingTrialTime(subscription) : 0;
  
  // Calculate remaining days and hours
  const trialDaysLeft = Math.floor(remainingTimeMs / (1000 * 60 * 60 * 24));
  const trialHoursLeft = Math.ceil(remainingTimeMs / (1000 * 60 * 60)) % 24;

  const userPlan = subscription?.plan === 'pro'
    ? 'Pro Plan'
    : subscription?.plan === 'trial'
      ? (trialActive ? 'Pro Trial' : 'Trial Expired')
      : 'Community Plan';

  const subStatus = subscription?.status || 'inactive';

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'N/A';
    }
  };

  // Inform the user that payment processing is pending Stripe integration
  const handleUpgradeToPro = () => {
    setUpgradeError('Stripe Integration Pending: Checkout and billing portals are not yet available. Plan upgrades will be unlocked in the upcoming Phase 5 payments implementation.');
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 max-w-4xl">
        <header className="flex flex-col justify-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Billing & Plans</h1>
          <p className="text-sm text-white/50">Manage your subscription, view invoices, and track trial duration.</p>
        </header>

        {profileError && (
          <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{profileError}</span>
          </div>
        )}

        {upgradeError && (
          <div className="px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{upgradeError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Plan Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/[0.08] relative overflow-hidden flex flex-col">
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-white/50">Current Subscription</span>
                <span className="text-xl font-bold text-white tracking-tight">{userPlan}</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-4 relative z-10 flex-1">
              <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs border-b border-white/[0.06] pb-4 mb-2">
                <div>
                  <span className="text-white/40 block">Plan Status</span>
                  <span className="font-semibold text-white capitalize">{subStatus}</span>
                </div>
                <div>
                  <span className="text-white/40 block">Access Tier</span>
                  <span className="font-semibold text-white">
                    {hasPremium ? 'Premium (Pro)' : 'Standard (Community)'}
                  </span>
                </div>
                {subscription?.plan === 'trial' && (
                  <>
                    <div>
                      <span className="text-white/40 block">Trial Started</span>
                      <span className="font-mono text-white/80">{formatDate(subscription.trialStartedAt)}</span>
                    </div>
                    <div>
                      <span className="text-white/40 block">Trial Ends</span>
                      <span className="font-mono text-white/80">{formatDate(subscription.trialEndsAt)}</span>
                    </div>
                  </>
                )}
              </div>

              {subscription?.plan === 'trial' && trialActive && (
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-xs text-white/60">
                    <span>Trial time remaining</span>
                    <span className="font-medium text-amber-400">
                      {trialDaysLeft > 0 ? `${trialDaysLeft}d ${trialHoursLeft}h` : `${trialHoursLeft}h remaining`}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-white/[0.04] rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (remainingTimeMs / (3 * 24 * 60 * 60 * 1000)) * 100)}%` }}
                      className="h-full bg-amber-500"
                    />
                  </div>
                </div>
              )}
              
              <p className="text-xs text-white/50 leading-relaxed">
                {subscription?.plan === 'pro'
                  ? 'Your workspace is fully upgraded to the Pro tier. You have unlimited projects, API keys, and device authentications.'
                  : subscription?.plan === 'trial' && trialActive
                    ? 'Your 3-day premium trial is active. You have access to all Pro features until your trial ends.'
                    : 'Your trial has expired or you are on the Community Plan. Upgrade to a paid plan to keep enjoying full Pro privileges.'}
              </p>
            </div>

            <div className="mt-8 relative z-10 flex items-center gap-3">
              {subscription?.plan !== 'pro' ? (
                <button
                  onClick={handleUpgradeToPro}
                  className="flex-1 py-2.5 rounded-lg bg-white text-black text-xs font-semibold hover:bg-white/90 transition-colors shadow-[0_2px_8px_rgba(255,255,255,0.15)] flex items-center justify-center gap-2"
                >
                  Upgrade to Pro
                </button>
              ) : (
                <button
                  disabled
                  className="flex-1 py-2.5 rounded-lg bg-white/10 text-white/40 text-xs font-semibold cursor-not-allowed border border-white/5 flex items-center justify-center gap-2"
                >
                  Active Subscription
                </button>
              )}
            </div>
          </div>

          {/* Payment Method */}
          <div className="p-6 rounded-2xl bg-white/[0.01] border border-white/[0.06] flex flex-col relative justify-between">
            <div className="flex flex-col mb-6">
              <span className="text-sm font-medium text-white/90">Stripe Billing Portal</span>
              <span className="text-xs text-white/50 mt-1">Payment and invoicing details are managed through Stripe.</span>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center py-8 border border-dashed border-white/[0.1] rounded-xl bg-white/[0.01] mb-6">
              <CreditCard className="w-6 h-6 text-white/20 mb-2" />
              <span className="text-xs text-white/40">No payment cards on file.</span>
            </div>

            <button 
              disabled
              className="w-full py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.08] text-white/40 text-xs font-semibold cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              Manage Subscription <ArrowUpRight className="w-3.5 h-3.5 opacity-30" />
            </button>
          </div>
        </div>

        {/* Invoices List */}
        <div className="flex flex-col gap-4 mt-4">
          <h2 className="text-sm font-semibold text-white/90">Invoices</h2>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] overflow-hidden flex flex-col items-center justify-center py-12">
            <CreditCard className="w-8 h-8 text-white/20 mb-3" />
            <p className="text-sm text-white/60 font-medium">No invoices yet</p>
            <p className="text-xs text-white/40 mt-1">Billing statements will appear here after Stripe portal integration.</p>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
