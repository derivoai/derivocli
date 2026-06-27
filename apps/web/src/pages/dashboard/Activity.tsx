import { DashboardLayout } from '../../components/dashboard/layout/DashboardLayout';
import { mockActivity } from '../../mock/data';
import { Activity as ActivityIcon, Check, Terminal, Key, User, Zap } from 'lucide-react';

export function Activity() {
  const getIcon = (iconName: string) => {
    const props = { className: "w-4 h-4 text-white/70" };
    switch (iconName) {
      case 'check': return <Check {...props} />;
      case 'terminal': return <Terminal {...props} />;
      case 'key': return <Key {...props} />;
      case 'user': return <User {...props} />;
      case 'zap': return <Zap className="w-4 h-4 text-amber-400" />;
      default: return <ActivityIcon {...props} />;
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 max-w-3xl">
        <header className="flex flex-col justify-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Activity Log</h1>
          <p className="text-sm text-white/50">A complete history of events and actions within your workspace.</p>
        </header>

        <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.01]">
          <div className="flex flex-col gap-8">
            {mockActivity.map((act, index) => (
              <div key={act.id} className="flex gap-4 relative group">
                {/* Timeline Line */}
                {index !== mockActivity.length - 1 && (
                  <div className="absolute left-[15px] top-8 bottom-[-32px] w-px bg-white/[0.06] group-hover:bg-white/[0.1] transition-colors" />
                )}
                
                {/* Icon Circle */}
                <div className="w-8 h-8 rounded-full bg-[#0a0a0a] border border-white/[0.1] flex items-center justify-center shrink-0 z-10">
                  {getIcon(act.icon)}
                </div>

                {/* Content */}
                <div className="flex flex-col flex-1 pt-1.5">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-medium text-white/90">{act.event}</span>
                    <span className="text-[11px] text-white/40 shrink-0">{act.timestamp}</span>
                  </div>
                  <p className="text-xs text-white/50 mt-1 leading-relaxed">
                    {act.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <button className="text-xs text-white/40 hover:text-white transition-colors border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] px-4 py-2 rounded-lg">
              Load more activity
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
