import { useMemo, useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/layout/DashboardLayout';
import {
  MonitorSmartphone,
  Search,
  Pencil,
  ShieldCheck,
  ShieldOff,
  LogOut,
  Trash2,
  Check,
  Copy,
} from 'lucide-react';
import { devicesApi, type DeviceInfo } from '../../lib/api';
import { useApiQuery } from '../../hooks/useApi';
import { ConfirmDialog } from '../../components/dashboard/shared/ConfirmDialog';
import { StatusBadge, type Tone } from '../../components/dashboard/shared/StatusBadge';
import { PageHeader } from '../../components/dashboard/shared/PageHeader';
import {
  EmptyState,
  ErrorState,
  RefreshButton,
  SkeletonList,
} from '../../components/dashboard/shared/States';
import { Modal } from '../../components/dashboard/ui/Modal';
import { Card, IconTile, SearchInput, KV } from '../../components/dashboard/ui/kit';
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
  const [copied, setCopied] = useState(false);

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
        <PageHeader
          eyebrow="Security"
          title="Trusted Devices"
          description="Machines authorized to access your workspace via the CLI."
          actions={<RefreshButton onClick={refetch} busy={loading} />}
        />

        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search devices..."
          icon={<Search className="w-4 h-4" />}
        />

        {loading ? (
          <SkeletonList rows={3} />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<MonitorSmartphone className="w-8 h-8" />}
            title={search ? 'No matching devices' : 'No devices registered'}
            description="Run the Derivo CLI on a machine to register it here."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((d) => {
              const status = deviceStatus(d);
              return (
                <Card
                  key={d.id}
                  hover
                  as="button"
                  onClick={() => {
                    setSelected(d);
                    setRenaming(false);
                    setCopied(false);
                  }}
                  className="text-left p-4 flex items-center justify-between gap-4 w-full"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <IconTile tone="neutral">
                      <MonitorSmartphone className="w-4 h-4" />
                    </IconTile>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium text-foreground truncate">{d.name}</span>
                      <span className="text-xs text-muted-foreground truncate">
                        {d.os ?? 'Unknown OS'} · {d.cliVersion ?? 'CLI'}
                      </span>
                    </div>
                  </div>
                  <StatusBadge label={status.label} tone={status.tone} />
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        open={!!selected}
        title={selected?.name ?? 'Device'}
        icon={<MonitorSmartphone className="w-4 h-4 text-muted-foreground" />}
        onClose={() => setSelected(null)}
        footer={
          selected && (
            <div className="flex flex-wrap justify-end gap-2 w-full">
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
          )
        }
      >
        {selected && (
          <div className="p-6">
            {renaming && (
              <div className="flex items-center gap-2 mb-4">
                <input
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  className="h-9 px-3 flex-1 rounded-[10px] bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent"
                />
                <button
                  onClick={submitRename}
                  disabled={busy}
                  className="p-2 rounded-lg bg-emerald-100 text-emerald-700 border border-emerald-200"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="mb-3">
              <StatusBadge
                label={deviceStatus(selected).label}
                tone={deviceStatus(selected).tone}
              />
            </div>
            <div className="grid grid-cols-3 gap-3 items-center py-2.5 border-b border-border">
              <span className="text-xs text-muted-foreground">Device ID</span>
              <div className="col-span-2 flex items-center gap-2 min-w-0">
                <code className="text-xs font-mono text-foreground truncate">{selected.id}</code>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(selected.id);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                  className="h-6 w-6 rounded-md flex items-center justify-center border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0"
                  title="Copy ID"
                >
                  {copied ? (
                    <Check className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>
            <KV label="Hostname">{selected.hostname || '—'}</KV>
            <KV label="Operating System">{selected.os || '—'}</KV>
            <KV label="Architecture">{selected.arch || '—'}</KV>
            <KV label="Node.js">{selected.nodeVersion || '—'}</KV>
            <KV label="CLI Version">{selected.cliVersion || '—'}</KV>
            <KV label="Trusted">{selected.isTrusted ? 'Yes' : 'No'}</KV>
            <KV label="Fingerprint" mono>
              {maskFingerprint(selected.fingerprint)}
            </KV>
            <KV label="First Registered">{formatDateTime(selected.createdAt)}</KV>
            <KV label="Last Seen">{relativeTime(selected.lastSeenAt)}</KV>
          </div>
        )}
      </Modal>

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
          else runAction(() => devicesApi.revoke(device.id));
        }}
        onCancel={() => setConfirm(null)}
      />
    </DashboardLayout>
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
          ? 'bg-red-100 hover:bg-red-200 text-red-700 border-red-200'
          : 'bg-background hover:bg-secondary text-foreground border-border'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}
