import { DashboardLayout } from '../../components/dashboard/layout/DashboardLayout';
import { mockUser } from '../../mock/data';
import { User, Github, AlertTriangle } from 'lucide-react';

export function Settings() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-10 max-w-3xl pb-10">
        <header className="flex flex-col justify-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Settings</h1>
          <p className="text-sm text-white/50">Manage your profile, connected accounts, and security preferences.</p>
        </header>

        {/* Profile Section */}
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-white/90">Profile</h2>
          <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.01] flex flex-col gap-6">
            <div className="flex items-center gap-6">
              <div className="relative group">
                <img src={mockUser.avatar} alt={mockUser.name} className="w-16 h-16 rounded-full border border-white/10" />
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <span className="text-[10px] font-medium text-white">Edit</span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-white/90">Profile Picture</span>
                <span className="text-[11px] text-white/40">JPG, GIF or PNG. Max size of 2MB.</span>
              </div>
            </div>

            <div className="w-full h-px bg-white/[0.06]" />

            <form className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-white/70 ml-1">Full Name</label>
                  <input 
                    type="text" 
                    defaultValue={mockUser.name}
                    className="w-full bg-[#050505] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-white/70 ml-1">Email Address</label>
                  <input 
                    type="email" 
                    defaultValue={mockUser.email}
                    className="w-full bg-[#050505] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white/50 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all cursor-not-allowed"
                    disabled
                  />
                </div>
              </div>
              
              <div className="flex justify-end mt-2">
                <button type="button" className="px-4 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-white text-xs font-medium hover:bg-white/[0.1] transition-colors">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* Connected Accounts */}
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-white/90">Connected Accounts</h2>
          <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.01] flex flex-col gap-4">
            <div className="flex items-center justify-between p-4 rounded-xl border border-white/[0.06] bg-[#050505]">
              <div className="flex items-center gap-3">
                <Github className="w-5 h-5 text-white/80" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-white/90">GitHub</span>
                  <span className="text-[11px] text-white/40">Connected as jane-doe</span>
                </div>
              </div>
              <button className="text-xs text-white/50 hover:text-white transition-colors">
                Disconnect
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-xl border border-dashed border-white/[0.1] bg-transparent">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 opacity-70" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-white/90">Google</span>
                  <span className="text-[11px] text-white/40">Connect your Google account</span>
                </div>
              </div>
              <button className="text-xs text-white/90 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] px-3 py-1.5 rounded-lg border border-white/[0.06] transition-colors">
                Connect
              </button>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-red-400">Danger Zone</h2>
          <div className="p-6 rounded-2xl border border-red-500/20 bg-red-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-white/90">Delete Account</span>
              <span className="text-xs text-white/50 leading-relaxed max-w-sm">
                Permanently delete your account and all of its contents from the Derivo platform. This action is not reversible.
              </span>
            </div>
            <button className="px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors shrink-0">
              Delete Account
            </button>
          </div>
        </section>

      </div>
    </DashboardLayout>
  );
}
