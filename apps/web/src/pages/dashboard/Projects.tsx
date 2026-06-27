import { DashboardLayout } from '../../components/dashboard/layout/DashboardLayout';
import { Search, Plus, Filter, MoreVertical, ArrowRight } from 'lucide-react';
import { useProjects } from '../../hooks/useDashboardData';

export function Projects() {
  const { data: projects, loading, error } = useProjects();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white/80 animate-spin" />
            <span className="text-xs text-white/40 font-mono">Loading projects...</span>
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
              <svg
                className="w-6 h-6 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <span className="text-sm text-white/60">{error}</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Projects</h1>
            <p className="text-sm text-white/50">
              Manage your connected repositories and environments.
            </p>
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
            {projects.length > 0 ? (
              projects.map((project) => (
                <div
                  key={project.id}
                  className="p-5 rounded-xl border border-white/[0.06] bg-gradient-to-b from-white/[0.02] to-transparent hover:border-white/[0.12] transition-colors flex flex-col group relative overflow-hidden"
                >
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
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${project.status === 'synced' ? 'bg-emerald-500' : project.status === 'error' ? 'bg-red-500' : 'bg-amber-500'}`}
                      />
                      <span className="text-xs text-white/50 capitalize">{project.status}</span>
                    </div>
                    <span className="text-[10px] text-white/30">{project.lastSync}</span>
                  </div>

                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>
              ))
            ) : (
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-center">
                <span className="w-10 h-10 text-white/20 mb-3">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </span>
                <p className="text-sm text-white/60 font-medium">No projects yet</p>
                <p className="text-xs text-white/40 mt-1">
                  Install the Derivo CLI to create your first project.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
