import { useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/layout/DashboardLayout';
import { MonitorSmartphone, LogOut, ShieldOff } from 'lucide-react';
import { sessionsApi, type SessionInfo } from '../../lib/api';
import { useApiQuery } from '../../hooks/useApi';
import { ConfirmDialog } from '../../components/dashboard/shared/ConfirmDialog';
import { StatusBadge } from '../../components/dashboard/shared/StatusBadge';
import { PageHeader } from '../../components/dashboard/shared/PageHeader';
import {
  EmptyState,
  ErrorState,
  RefreshButton,
  SkeletonList,
} from '../../components/dashboard/shared/States';
import { Card, Btn, IconTile } from '../../components/dashboard/ui/kit';
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
        <PageHeader
          eyebrow="Security"
          title="Active Sessions"
          description="Devices and clients currently signed in to your account."
          actions={
            <div className="flex items-center gap-2.5">
              <RefreshButton onClick={refetch} busy={loading} />
              {sessions.length > 1 && (
                <Btn
                  variant="danger"
                  onClick={() => setConfirm({ type: 'all' })}
                  icon={<ShieldOff className="w-3.5 h-3.5" />}
                >
                  Log out others
                </Btn>
              )}
            </div>
          }
        />

        {loading ? (
          <SkeletonList rows={3} />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : sessions.length === 0 ? (
          <EmptyState
            icon={<MonitorSmartphone className="w-8 h-8" />}
            title="No active sessions"
            description="Run derivo login from the CLI to start a session, and it will appear here."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {sessions.map((s) => (
              <Card key={s.id} className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <IconTile tone="neutral">
                    <MonitorSmartphone className="w-4 h-4" />
                  </IconTile>
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
                    className="h-8 px-3 rounded-lg bg-white/[0.04] hover:bg-bad/15 hover:text-bad text-white/60 text-xs font-medium border border-white/[0.08] transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Log out
                  </button>
                )}
              </Card>
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
