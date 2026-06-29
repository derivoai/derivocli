import { useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/layout/DashboardLayout';
import { MonitorSmartphone, LogOut, ShieldOff } from 'lucide-react';
import { sessionsApi, type SessionInfo } from '../../lib/api';
import { useApiQuery } from '../../hooks/useApi';
import { ConfirmDialog } from '../../components/dashboard/shared/ConfirmDialog';
import { StatusBadge } from '../../components/dashboard/shared/StatusBadge';
import {
  EmptyState,
  ErrorState,
  RefreshButton,
  SkeletonList,
} from '../../components/dashboard/shared/States';
import { relativeTime, formatDateTime } from '../../lib/relative-time';

export function Sessions() {
  const { data, loading, error, refetch } = useApiQuery(() => sessionsApi.list(), []);
  const [confirm, setConfirm] = useState<{ type: 'one' | 'all'; session?: SessionInfo } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);

  const sessions = data?.sessions ?? [];

  const handleConfirm = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      if (confirm.type === 'all') await sessionsApi.logoutAll(currentId(sessions));
      else if (confirm.session) await sessionsApi.logout(confirm.session.id);
      refetch();
    } catch {
      /* surfaced on refetch */
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <header className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Active Sessions</h1>
            <p className="text-sm text-white/50">
              Devices and clients currently signed in to your account.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <RefreshButton onClick={refetch} busy={loading} />
            {sessions.length > 1 && (
              <button
                onClick={() => setConfirm({ type: 'all' })}
                className="h-9 px-4 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/20 transition-colors flex items-center gap-2"
              >
                <ShieldOff className="w-3.5 h-3.5" />
                Log out others
              </button>
            )}
          </div>
        </header>

        {loading ? (
          <SkeletonList rows={3} />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : sessions.length === 0 ? (
          <EmptyState
            icon={<MonitorSmartphone className="w-10 h-10" />}
            title="No active sessions"
            description="Sessions appear here when you sign in from the CLI or another device."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.01] flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
                    <MonitorSmartphone className="w-4 h-4 text-white/60" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white/90 truncate">
                        {s.deviceName || s.deviceId || 'Unknown device'}
                      </span>
                      {s.current && <StatusBadge label="This session" tone="green" />}
                    </div>
                    <span className="text-xs text-white/40">
                      Last active {relativeTime(s.lastSeenAt)} · created{' '}
                      {formatDateTime(s.createdAt)}
                    </span>
                  </div>
                </div>
                {!s.current && (
                  <button
                    onClick={() => setConfirm({ type: 'one', session: s })}
                    className="h-8 px-3 rounded-lg bg-white/[0.04] hover:bg-red-500/15 hover:text-red-400 text-white/60 text-xs font-medium border border-white/[0.06] transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Log out
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.type === 'all' ? 'Log out other sessions?' : 'Log out this session?'}
        message={
          confirm?.type === 'all'
            ? 'All other sessions will be signed out immediately and must re-authenticate.'
            : 'This session will be signed out immediately and will need to log in again.'
        }
        confirmLabel="Log out"
        busy={busy}
        onConfirm={handleConfirm}
        onCancel={() => setConfirm(null)}
      />
    </DashboardLayout>
  );
}

function currentId(sessions: SessionInfo[]): string | undefined {
  return sessions.find((s) => s.current)?.id;
}
