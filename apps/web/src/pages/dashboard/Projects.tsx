import { DashboardLayout } from '../../components/dashboard/layout/DashboardLayout';
import { mockProjects } from '../../mock/data';
import { Search, Plus, Filter, MoreVertical, ArrowRight } from 'lucide-react';

export function Projects() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Projects</h1>
            <p className="text-sm text-white/50">Manage your connected repositories and environments.</p>
          </div>
          <button className="h-9 px-4 rounded-lg bg-white text-black text-xs font-semibold hover:bg-white/90 transition-colors flex items-center justify-center gap-2 shadow-[0_2px_8px_rgba(255,255,255,0.15)] w-full sm:w-auto">
            <Plus className="w-3.5 h-3.5" />
            New Project
          </button>
        </header>

        <div className="flex flex-col gap-4">
          {/* Controls */}
          <div className="flex items-center gap-3 w-full">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search projects..." 
                className="w-full h-9 pl-9 pr-4 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-colors"
              />
            </div>
            <button className="h-9 px-3 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] transition-colors flex items-center gap-2 text-xs font-medium text-white/70">
              <Filter className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Filter</span>
            </button>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {mockProjects.map((project) => (
              <div key={project.id} className="p-5 rounded-xl border border-white/[0.06] bg-gradient-to-b from-white/[0.02] to-transparent hover:border-white/[0.12] transition-colors flex flex-col group relative overflow-hidden">
                <div className="flex items-start justify-between mb-8 relative z-10">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-base font-semibold text-white/90">{project.name}</h3>
                    <div className="flex items-center gap-2 text-xs font-mono text-white/40">
                      <span>{project.framework}</span>
                      <span>•</span>
                      <span>{project.env}</span>
                    </div>
                  </div>
                  <button className="p-1 text-white/30 hover:text-white transition-colors rounded-md hover:bg-white/[0.05]">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/[0.04] relative z-10">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${project.status === 'synced' ? 'bg-emerald-500' : project.status === 'error' ? 'bg-red-500' : 'bg-amber-500'}`} />
                    <span className="text-xs text-white/50 capitalize">{project.status}</span>
                  </div>
                  <span className="text-[10px] text-white/30">{project.lastSync}</span>
                </div>
                
                {/* Glow effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
