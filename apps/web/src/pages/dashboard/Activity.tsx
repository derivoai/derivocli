import { DashboardLayout } from '../../components/dashboard/layout/DashboardLayout';
import { Activity as ActivityIcon, Check, Terminal, Key, User, Zap } from 'lucide-react';
import { useActivity } from '../../hooks/useDashboardData';

export function Activity() {
  const { data: activity, loading, error } = useActivity();
  const getIcon = (iconName: string) => {
    const props = { className: 'w-4 h-4 text-white/70' };
    switch (iconName) {
      case 'check':
        return <Check {...props} />;
      case 'terminal':
        return <Terminal {...props} />;
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white/80 animate-spin" />
            <span className="text-xs text-white/40 font-mono">Loading activity...</span>
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
      <div className="flex flex-col gap-8 max-w-3xl">
        <header className="flex flex-col justify-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Activity Log</h1>
          <p className="text-sm text-white/50">
            A complete history of events and actions within your workspace.
          </p>
        </header>

        <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.01]">
          {activity.length > 0 ? (
            <div className="flex flex-col gap-8">
              {activity.map((act, index) => (
                <div key={act.id} className="flex gap-4 relative group">
                  {index !== activity.length - 1 && (
                    <div className="absolute left-[15px] top-8 bottom-[-32px] w-px bg-white/[0.06] group-hover:bg-white/[0.1] transition-colors" />
                  )}

                  <div className="w-8 h-8 rounded-full bg-[#0a0a0a] border border-white/[0.1] flex items-center justify-center shrink-0 z-10">
                    {getIcon(act.icon)}
                  </div>

                  <div className="flex flex-col flex-1 pt-1.5">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm font-medium text-white/90">{act.event}</span>
                      <span className="text-[11px] text-white/40 shrink-0">{act.timestamp}</span>
                    </div>
                    <p className="text-xs text-white/50 mt-1 leading-relaxed">{act.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <ActivityIcon className="w-10 h-10 text-white/20 mb-3" />
              <p className="text-sm text-white/60 font-medium">No recent activity</p>
              <p className="text-xs text-white/40 mt-1">
                Activity will appear here once you start using Derivo.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
