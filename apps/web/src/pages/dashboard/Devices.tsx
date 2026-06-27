import { DashboardLayout } from '../../components/dashboard/layout/DashboardLayout';
import { Monitor, Laptop, Server, Trash2, ShieldCheck } from 'lucide-react';
import { useDevices } from '../../hooks/useDashboardData';

export function Devices() {
  const { data: devices, loading, error } = useDevices();
  const getIcon = (type: string) => {
    switch (type) {
      case 'mac':
        return <Laptop className="w-5 h-5 text-white/70" />;
      case 'windows':
        return <Monitor className="w-5 h-5 text-white/70" />;
      case 'linux':
        return <Server className="w-5 h-5 text-white/70" />;
      default:
        return <Monitor className="w-5 h-5 text-white/70" />;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white/80 animate-spin" />
            <span className="text-xs text-white/40 font-mono">Loading devices...</span>
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
            <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Devices</h1>
            <p className="text-sm text-white/50">
              Manage devices authorized to access your workspace via CLI.
            </p>
          </div>
        </header>

        <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#050505] text-xs font-medium text-white/40 uppercase tracking-wider border-b border-white/[0.06]">
                <tr>
                  <th className="px-6 py-4 font-medium">Device</th>
                  <th className="px-6 py-4 font-medium">Environment</th>
                  <th className="px-6 py-4 font-medium">Location</th>
                  <th className="px-6 py-4 font-medium">Last Active</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {devices.map((device) => (
                  <tr key={device.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
                          {getIcon(device.type)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-white/90">{device.name}</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {device.isTrusted && (
                              <ShieldCheck className="w-3 h-3 text-emerald-500" />
                            )}
                            <span className="text-[11px] text-white/40">
                              {device.isTrusted ? 'Trusted' : 'Untrusted'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-white/70">{device.os}</span>
                        <span className="text-[11px] text-white/40 mt-0.5 font-mono">
                          CLI {device.cliVersion}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white/60 text-xs">{device.location}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white/60 text-xs">{device.lastActive}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-white/30 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {devices.length === 0 && (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <Monitor className="w-10 h-10 text-white/20 mb-3" />
              <p className="text-sm text-white/60 font-medium">No devices connected</p>
              <p className="text-xs text-white/40 mt-1">
                Authenticate a device via the CLI to see it here.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
