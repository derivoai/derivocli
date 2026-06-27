import { DashboardLayout } from '../../components/dashboard/layout/DashboardLayout';
import { mockApiKeys } from '../../mock/data';
import { KeyRound, Plus, Trash2, Copy, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

export function ApiKeys() {
  const [showKey, setShowKey] = useState<string | null>(null);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white mb-2">API Keys</h1>
            <p className="text-sm text-white/50">Manage access tokens for your workspace APIs.</p>
          </div>
          <button className="h-9 px-4 rounded-lg bg-white text-black text-xs font-semibold hover:bg-white/90 transition-colors flex items-center justify-center gap-2 shadow-[0_2px_8px_rgba(255,255,255,0.15)] w-full sm:w-auto">
            <Plus className="w-3.5 h-3.5" />
            Generate Key
          </button>
        </header>

        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex gap-3 text-amber-500/90 text-sm">
          <KeyRound className="w-5 h-5 shrink-0" />
          <p className="leading-relaxed">
            API keys grant full access to your workspace. Treat them like passwords. Keys will only be shown once upon creation.
          </p>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#050505] text-xs font-medium text-white/40 uppercase tracking-wider border-b border-white/[0.06]">
                <tr>
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Key Prefix</th>
                  <th className="px-6 py-4 font-medium">Created</th>
                  <th className="px-6 py-4 font-medium">Last Used</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {mockApiKeys.map((apiKey) => (
                  <tr key={apiKey.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-medium text-white/90">{apiKey.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono text-white/60 bg-white/[0.05] px-2 py-1 rounded">
                          {showKey === apiKey.id ? apiKey.preview : 'drv_••••••••••••••'}
                        </code>
                        <button 
                          onClick={() => setShowKey(showKey === apiKey.id ? null : apiKey.id)}
                          className="p-1.5 text-white/40 hover:text-white hover:bg-white/[0.1] rounded transition-colors"
                        >
                          {showKey === apiKey.id ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white/60 text-xs">{apiKey.created}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white/60 text-xs">{apiKey.lastUsed}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100">
                        <button className="p-2 text-white/40 hover:text-white hover:bg-white/[0.1] rounded-lg transition-colors">
                          <Copy className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-white/30 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {mockApiKeys.length === 0 && (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <KeyRound className="w-10 h-10 text-white/20 mb-3" />
              <p className="text-sm text-white/60 font-medium">No API keys</p>
              <p className="text-xs text-white/40 mt-1">Generate an API key to access the Derivo API.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
