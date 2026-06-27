import { DashboardLayout } from '../../components/dashboard/layout/DashboardLayout';
import { mockProjects, mockDevices, mockActivity } from '../../mock/data';
import { Plus, Terminal, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useUserProfile } from '../../hooks/useUserProfile';

export function DashboardHome() {
  const { profile, loading } = useUserProfile();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white/80 animate-spin" />
            <span className="text-xs text-white/40 font-mono">Loading profile data...</span>
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
      <div className="flex flex-col gap-8">
        
        {/* Welcome Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">
              Welcome back, {profile?.name.split(' ')[0] || 'User'}
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
            <button className="h-9 px-4 rounded-lg bg-white text-black text-xs font-semibold hover:bg-white/90 transition-colors flex items-center gap-2 shadow-[0_2px_8px_rgba(255,255,255,0.15)]">
              <Plus className="w-3.5 h-3.5" />
              New Project
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Status Card 1 */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-2xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/[0.06] flex flex-col gap-4 relative overflow-hidden group"
          >
            <div className="flex items-center justify-between relative z-10">
              <span className="text-xs font-medium text-white/50">Current Plan</span>
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <div className="relative z-10">
              <div className="text-2xl font-semibold text-white tracking-tight">{userPlan}</div>
              {profile?.role === 'pro_trial' && (
                <div className="text-xs text-white/40 mt-1">{trialDaysLeft} days remaining</div>
              )}
            </div>
            <div className="absolute right-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <Link to="/dashboard/billing" className="text-[10px] text-white/40 hover:text-white flex items-center gap-1 uppercase tracking-wider">
                Manage <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </motion.div>


          {/* Status Card 2 */}
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
              <div className="text-2xl font-semibold text-white tracking-tight">{mockProjects.length}</div>
              <div className="text-xs text-white/40 mt-1">Across {mockDevices.length} environments</div>
            </div>
          </motion.div>

          {/* Status Card 3 */}
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
              <Link to="/dashboard/projects" className="text-xs text-white/40 hover:text-white transition-colors">View all</Link>
            </div>
            <div className="flex flex-col gap-2">
              {mockProjects.slice(0,3).map((project) => (
                <div key={project.id} className="p-4 rounded-xl border border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.03] transition-colors flex items-center justify-between group">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-white/90">{project.name}</span>
                    <span className="text-[11px] font-mono text-white/40">{project.framework} • {project.env}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 hidden sm:flex">
                      <div className={`w-1.5 h-1.5 rounded-full ${project.status === 'synced' ? 'bg-emerald-500' : project.status === 'error' ? 'bg-red-500' : 'bg-amber-500'}`} />
                      <span className="text-xs text-white/50 capitalize">{project.status}</span>
                    </div>
                    <button className="text-white/30 group-hover:text-white transition-colors p-1">
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white/90">Activity</h2>
              <Link to="/dashboard/activity" className="text-xs text-white/40 hover:text-white transition-colors">View log</Link>
            </div>
            <div className="p-5 rounded-xl border border-white/[0.05] bg-white/[0.01] flex flex-col gap-6">
              {mockActivity.slice(0,4).map((act, i) => (
                <div key={act.id} className="flex gap-4 relative">
                  {i !== 3 && <div className="absolute left-[9px] top-6 bottom-[-24px] w-px bg-white/[0.05]" />}
                  <div className="w-5 h-5 rounded-full bg-[#0a0a0a] border border-white/[0.1] flex items-center justify-center shrink-0 mt-0.5 z-10">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-white/80">{act.event}</span>
                    <span className="text-[11px] text-white/40 mt-0.5 leading-relaxed">{act.description}</span>
                    <span className="text-[10px] text-white/30 mt-1">{act.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
