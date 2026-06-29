import { useMemo, useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/layout/DashboardLayout';
import {
  MonitorSmartphone,
  Search,
  X,
  Pencil,
  ShieldCheck,
  ShieldOff,
  LogOut,
  Trash2,
  Check,
} from 'lucide-react';
import { devicesApi, type DeviceInfo } from '../../lib/api';
import { useApiQuery } from '../../hooks/useApi';
import { ConfirmDialog } from '../../components/dashboard/shared/ConfirmDialog';
import { StatusBadge, type Tone } from '../../components/dashboard/shared/StatusBadge';
import {
  EmptyState,
  ErrorState,
  RefreshButton,
  SkeletonList,
} from '../../components/dashboard/shared/States';
import { relativeTime, formatDateTime, isOnline } from '../../lib/relative-time';

type ActionType = 'revoke' | 'delete' | 'logout' | null;

function deviceStatus(d: DeviceInfo): { label: string; tone: Tone } {
  if (d.revoked) return { label: 'Revoked', tone: 'red' };
  if (!d.isTrusted) return { label: 'Untrusted', tone: 'amber' };
  if (isOnline(d.lastSeenAt)) return { label: 'Online', tone: 'green' };
  return { label: `Last seen ${relativeTime(d.lastSeenAt)}`, tone: 'gray' };
}

function maskFingerprint(fp?: string): string {
  if (!fp) return '—';
  return `${fp.slice(0, 6)}…${fp.slice(-4)}`;
}

export function Devices() {
  const { data, loading, error, refetch } = useApiQuery(() => devicesApi.list(), []);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<DeviceInfo | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [confirm, setConfirm] = useState<{ type: ActionType; device: DeviceInfo } | null>(null);
  const [busy, setBusy] = useState(false);

  const devices = data?.devices ?? [];
  const filtered = useMemo(
    () =>
      devices.filter((d) =>
        `${d.name} ${d.os ?? ''} ${d.id}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [devices, search],
  );

  const runAction = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
      refetch();
      setSelected(null);
    } catch {
      /* surfaced on refetch */
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  const submitRename = async () => {
    if (!selected || !renameValue.trim()) return;
    await runAction(() => devicesApi.rename(selected.id, renameValue.trim()));
    setRenaming(false);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <header className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Trusted Devices</h1>
            <p className="text-sm text-white/50">
              Devices authorized to access your workspace via the CLI.
            </p>
          </div>
          <RefreshButton onClick={refetch} busy={loading} />
        </header>

        <div className="relative">
          <Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search devices..."
            className="w-full h-9 pl-9 pr-4 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-colors"
          />
        </div>

        {loading ? (
          <SkeletonList rows={3} />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<MonitorSmartphone className="w-10 h-10" />}
            title={search ? 'No matching devices' : 'No devices registered'}
            description="Run the Derivo CLI on a machine to register it here."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((d) => {
              const status = deviceStatus(d);
              return (
                <button
                  key={d.id}
                  onClick={() => {
                    setSelected(d);
                    setRenaming(false);
                  }}
                  className="text-left p-4 rounded-xl border border-white/[0.06] bg-white/[0.01] hover:border-white/[0.12] transition-colors flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
                      <MonitorSmartphone className="w-4 h-4 text-white/60" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium text-white/90 truncate">{d.name}</span>
                      <span className="text-xs text-white/40 truncate">
                        {d.os ?? 'Unknown OS'} · {d.cliVersion ?? 'CLI'}
                      </span>
                    </div>
                  </div>
                  <StatusBadge label={status.label} tone={status.tone} />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0b0b0b] border border-white/[0.08] w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.04]">
              <div className="flex items-center gap-2 min-w-0">
                <MonitorSmartphone className="w-4 h-4 text-white/60 shrink-0" />
                {renaming ? (
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      className="h-8 px-2 rounded-md bg-white/[0.04] border border-white/[0.1] text-sm text-white focus:outline-none focus:border-white/30"
                    />
                    <button
                      onClick={submitRename}
                      disabled={busy}
                      className="p-1.5 rounded-md bg-emerald-500/15 text-emerald-400"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <h2 className="text-lg font-semibold text-white truncate">{selected.name}</h2>
                )}
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-1 hover:bg-white/5 rounded-lg text-white/50 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-2.5 overflow-y-auto">
              <div className="mb-2">
                <StatusBadge
                  label={deviceStatus(selected).label}
                  tone={deviceStatus(selected).tone}
                />
              </div>
              <Detail label="Device ID" mono>
                {selected.id}
              </Detail>
              <Detail label="Hostname">{selected.hostname || '—'}</Detail>
              <Detail label="Operating System">{selected.os || '—'}</Detail>
              <Detail label="Architecture">{selected.arch || '—'}</Detail>
              <Detail label="Node.js">{selected.nodeVersion || '—'}</Detail>
              <Detail label="CLI Version">{selected.cliVersion || '—'}</Detail>
              <Detail label="Trusted">{selected.isTrusted ? 'Yes' : 'No'}</Detail>
              <Detail label="Fingerprint" mono>
                {maskFingerprint(selected.fingerprint)}
              </Detail>
              <Detail label="First Registered">{formatDateTime(selected.createdAt)}</Detail>
              <Detail label="Last Seen">{relativeTime(selected.lastSeenAt)}</Detail>
              <Detail label="Location">{'Not available'}</Detail>
            </div>

            <div className="flex flex-wrap justify-end gap-2 px-6 py-4 border-t border-white/[0.04] bg-white/[0.01]">
              <ActionBtn
                icon={Pencil}
                label="Rename"
                onClick={() => {
                  setRenameValue(selected.name);
                  setRenaming(true);
                }}
              />
              {selected.isTrusted ? (
                <ActionBtn
                  icon={ShieldOff}
                  label="Untrust"
                  onClick={() => runAction(() => devicesApi.untrust(selected.id))}
                />
              ) : (
                <ActionBtn
                  icon={ShieldCheck}
                  label="Trust"
                  onClick={() => runAction(() => devicesApi.trust(selected.id))}
                />
              )}
              <ActionBtn
                icon={LogOut}
                label="Log out"
                danger
                onClick={() => setConfirm({ type: 'logout', device: selected })}
              />
              <ActionBtn
                icon={ShieldOff}
                label="Revoke"
                danger
                onClick={() => setConfirm({ type: 'revoke', device: selected })}
              />
              <ActionBtn
                icon={Trash2}
                label="Delete"
                danger
                onClick={() => setConfirm({ type: 'delete', device: selected })}
              />
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        title={
          confirm?.type === 'delete'
            ? 'Delete device?'
            : confirm?.type === 'revoke'
              ? 'Revoke device?'
              : 'Log out device?'
        }
        message={
          confirm?.type === 'delete'
            ? 'This permanently removes the device. The connected CLI will lose access and must re-register.'
            : confirm?.type === 'revoke'
              ? 'Revoking immediately removes trust. The connected CLI will lose authentication and must log in again.'
              : 'The CLI on this device will be signed out and must log in again.'
        }
        busy={busy}
        confirmLabel={
          confirm?.type === 'logout' ? 'Log out' : confirm?.type === 'delete' ? 'Delete' : 'Revoke'
        }
        onConfirm={() => {
          if (!confirm) return;
          const { type, device } = confirm;
          if (type === 'delete') runAction(() => devicesApi.remove(device.id));
          else runAction(() => devicesApi.revoke(device.id)); // revoke + logout both invalidate
        }}
        onCancel={() => setConfirm(null)}
      />
    </DashboardLayout>
  );
}

function Detail({
  label,
  children,
  mono,
}: {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 items-center">
      <span className="text-xs text-white/40">{label}</span>
      <span className={`col-span-2 text-xs text-white/90 ${mono ? 'font-mono break-all' : ''}`}>
        {children}
      </span>
    </div>
  );
}

function ActionBtn({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`h-8 px-3 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
        danger
          ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20'
          : 'bg-white/[0.04] hover:bg-white/[0.08] text-white/80 border-white/[0.06]'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}
