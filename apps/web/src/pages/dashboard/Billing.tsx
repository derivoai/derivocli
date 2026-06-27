import { DashboardLayout } from '../../components/dashboard/layout/DashboardLayout';
import { Zap, CreditCard, Download, ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useUserProfile } from '../../hooks/useUserProfile';

export function Billing() {
  const { profile, loading } = useUserProfile();

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

  const userPlan = profile?.role === 'pro' 
    ? 'Pro Plan' 
    : profile?.role === 'pro_trial' 
      ? 'Pro Trial' 
      : 'Community Plan';

  let trialDaysLeft = 0;
  if (profile?.trialExpiresAt) {
    const expires = new Date(profile.trialExpiresAt).getTime();
    const now = new Date().getTime();
    trialDaysLeft = Math.max(0, Math.ceil((expires - now) / (1000 * 60 * 60 * 24)));
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 max-w-4xl">
        <header className="flex flex-col justify-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Billing & Plans</h1>
          <p className="text-sm text-white/50">Manage your subscription, view invoices, and update payment methods.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Plan */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/[0.08] relative overflow-hidden flex flex-col">
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white/90">Current Plan</span>
                <span className="text-xl font-bold text-white tracking-tight">{userPlan}</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-4 relative z-10 flex-1">
              {profile?.role === 'pro_trial' && (
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-xs text-white/60">
                    <span>Trial time remaining</span>
                    <span className="font-medium text-white">{trialDaysLeft} days</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/[0.04] rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(trialDaysLeft / 3) * 100}%` }}
                      className="h-full bg-amber-500"
                    />
                  </div>
                </div>
              )}
              <p className="text-xs text-white/50 leading-relaxed mt-2">
                {profile?.role === 'pro_trial' 
                  ? `Your 3-day trial is currently active. Upgrade to a paid plan to keep enjoying full Pro privileges.`
                  : `You are on the free Community plan. Upgrade to access premium features.`}
              </p>
            </div>

            <div className="mt-8 relative z-10 flex items-center gap-3">
              <button className="flex-1 py-2.5 rounded-lg bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors shadow-[0_2px_8px_rgba(255,255,255,0.15)]">
                Upgrade to Pro
              </button>
            </div>
          </div>

          {/* Payment Method */}
          <div className="p-6 rounded-2xl bg-white/[0.01] border border-white/[0.06] flex flex-col relative">
            <div className="flex flex-col mb-6">
              <span className="text-sm font-medium text-white/90">Payment Method</span>
              <span className="text-xs text-white/50 mt-1">No payment method on file.</span>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center py-6 border border-dashed border-white/[0.1] rounded-xl bg-white/[0.01]">
              <CreditCard className="w-6 h-6 text-white/20 mb-2" />
              <button className="text-xs font-medium text-white/70 hover:text-white transition-colors flex items-center gap-1.5">
                Add payment method <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Invoices */}
        <div className="flex flex-col gap-4 mt-4">
          <h2 className="text-sm font-semibold text-white/90">Invoices</h2>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] overflow-hidden flex flex-col items-center justify-center py-12">
            <CreditCard className="w-8 h-8 text-white/20 mb-3" />
            <p className="text-sm text-white/60 font-medium">No invoices yet</p>
            <p className="text-xs text-white/40 mt-1">Your billing history will appear here.</p>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
