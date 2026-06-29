import { useMemo, useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/layout/DashboardLayout';
import {
  KeyRound,
  Plus,
  Search,
  X,
  Copy,
  RefreshCw,
  Ban,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { keysApi, type ApiKeyInfo, type CreatedKey } from '../../lib/api';
import { useApiQuery } from '../../hooks/useApi';
import { ConfirmDialog } from '../../components/dashboard/shared/ConfirmDialog';
import { StatusBadge, type Tone } from '../../components/dashboard/shared/StatusBadge';
import {
  EmptyState,
  ErrorState,
  RefreshButton,
  SkeletonList,
} from '../../components/dashboard/shared/States';
import { relativeTime, formatDateTime } from '../../lib/relative-time';

const SCOPES = ['projects:read', 'projects:write', 'devices:read', 'devices:write', 'billing:read'];

function statusTone(s: ApiKeyInfo['status']): Tone {
  return s === 'active' ? 'green' : s === 'disabled' ? 'amber' : s === 'expired' ? 'gray' : 'red';
}

export function ApiKeys() {
  const { data, loading, error, refetch } = useApiQuery(() => keysApi.list(), []);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<CreatedKey | null>(null);
  const [confirm, setConfirm] = useState<{ type: 'revoke' | 'rotate'; key: ApiKeyInfo } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  // create form
  const [name, setName] = useState('');
  const [environment, setEnvironment] = useState<'live' | 'test'>('live');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [tagsInput, setTagsInput] = useState('');

  const keys = data?.keys ?? [];
  const filtered = useMemo(
    () =>
      keys.filter((k) =>
        `${k.name} ${k.tags.join(' ')}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [keys, search],
  );

  const submitCreate = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const result = await keysApi.create({
        name: name.trim(),
        environment,
        permissions,
        tags: tagsInput
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      });
      setCreated(result);
      setCreating(false);
      setName('');
      setPermissions([]);
      setTagsInput('');
      refetch();
    } catch {
      /* surfaced on refetch */
    } finally {
      setBusy(false);
    }
  };

  const runAction = async (fn: () => Promise<unknown>, onDone?: (r: unknown) => void) => {
    setBusy(true);
    try {
      const r = await fn();
      onDone?.(r);
      refetch();
    } catch {
      /* surfaced */
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
            <h1 className="text-2xl font-bold tracking-tight text-white mb-2">API Keys</h1>
            <p className="text-sm text-white/50">
              Programmatic access tokens for the Derivo API and CLI.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <RefreshButton onClick={refetch} busy={loading} />
            <button
              onClick={() => setCreating(true)}
              className="h-9 px-4 rounded-lg bg-white text-black text-xs font-semibold hover:bg-white/90 transition-colors flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" />
              New Key
            </button>
          </div>
        </header>

        <div className="relative">
          <Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search keys..."
            className="w-full h-9 pl-9 pr-4 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-colors"
          />
        </div>

        {loading ? (
          <SkeletonList rows={3} />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<KeyRound className="w-10 h-10" />}
            title={search ? 'No matching keys' : 'No API keys yet'}
            description="Create a key to authenticate programmatic access."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((k) => (
              <div
                key={k.id}
                className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.01] flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-white/90">{k.name}</span>
                      <StatusBadge label={k.status} tone={statusTone(k.status)} />
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.04] text-white/40 border border-white/[0.06]">
                        {k.environment}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-white/40 mt-1">{k.preview}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {k.status === 'active' && (
                      <IconBtn
                        title="Disable"
                        onClick={() =>
                          runAction(() => keysApi.update(k.id, { status: 'disabled' }))
                        }
                      >
                        <Ban className="w-3.5 h-3.5" />
                      </IconBtn>
                    )}
                    {k.status === 'disabled' && (
                      <IconBtn
                        title="Enable"
                        onClick={() => runAction(() => keysApi.update(k.id, { status: 'active' }))}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </IconBtn>
                    )}
                    <IconBtn title="Rotate" onClick={() => setConfirm({ type: 'rotate', key: k })}>
                      <RefreshCw className="w-3.5 h-3.5" />
                    </IconBtn>
                    <IconBtn
                      title="Revoke"
                      danger
                      onClick={() => setConfirm({ type: 'revoke', key: k })}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </IconBtn>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-[11px] text-white/40 border-t border-white/[0.04] pt-2 flex-wrap">
                  <span>Created {formatDateTime(k.createdAt)}</span>
                  <span>Last used {relativeTime(k.lastUsedAt)}</span>
                  <span>Expires {k.expiresAt ? formatDateTime(k.expiresAt) : 'never'}</span>
                  {k.permissions.length > 0 && <span>Scopes: {k.permissions.join(', ')}</span>}
                  {k.tags.length > 0 && <span>Tags: {k.tags.join(', ')}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      {creating && (
        <Modal title="Create API Key" onClose={() => setCreating(false)}>
          <div className="p-6 space-y-4">
            <Labeled label="Name">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. CI deploy key"
                className="w-full h-9 px-3 rounded-lg bg-white/[0.04] border border-white/[0.1] text-sm text-white focus:outline-none focus:border-white/30"
              />
            </Labeled>
            <Labeled label="Environment">
              <div className="flex gap-2">
                {(['live', 'test'] as const).map((env) => (
                  <button
                    key={env}
                    onClick={() => setEnvironment(env)}
                    className={`h-8 px-3 rounded-lg text-xs font-medium border ${
                      environment === env
                        ? 'bg-white text-black border-white'
                        : 'bg-white/[0.04] text-white/70 border-white/[0.08]'
                    }`}
                  >
                    {env}
                  </button>
                ))}
              </div>
            </Labeled>
            <Labeled label="Permissions">
              <div className="flex flex-wrap gap-2">
                {SCOPES.map((scope) => {
                  const on = permissions.includes(scope);
                  return (
                    <button
                      key={scope}
                      onClick={() =>
                        setPermissions((p) => (on ? p.filter((s) => s !== scope) : [...p, scope]))
                      }
                      className={`h-7 px-2.5 rounded-md text-[11px] font-mono border ${
                        on
                          ? 'bg-blue-500/15 text-blue-400 border-blue-500/25'
                          : 'bg-white/[0.04] text-white/50 border-white/[0.08]'
                      }`}
                    >
                      {scope}
                    </button>
                  );
                })}
              </div>
            </Labeled>
            <Labeled label="Tags (comma-separated)">
              <input
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="ci, production"
                className="w-full h-9 px-3 rounded-lg bg-white/[0.04] border border-white/[0.1] text-sm text-white focus:outline-none focus:border-white/30"
              />
            </Labeled>
          </div>
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/[0.04] bg-white/[0.01]">
            <button
              onClick={() => setCreating(false)}
              className="h-9 px-4 rounded-lg bg-white/[0.04] text-white text-xs font-semibold border border-white/[0.06]"
            >
              Cancel
            </button>
            <button
              onClick={submitCreate}
              disabled={busy || !name.trim()}
              className="h-9 px-4 rounded-lg bg-white text-black text-xs font-semibold disabled:opacity-50"
            >
              Create Key
            </button>
          </div>
        </Modal>
      )}

      {/* One-time reveal */}
      {created && (
        <Modal title="API Key Created" onClose={() => setCreated(null)}>
          <div className="p-6 space-y-4">
            <div className="px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
              Copy this key now — it will not be shown again.
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs font-mono text-white bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 break-all">
                {created.key}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(created.key);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="h-9 px-3 rounded-lg bg-white text-black text-xs font-semibold flex items-center gap-1.5 shrink-0"
              >
                {copied ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
          <div className="flex justify-end px-6 py-4 border-t border-white/[0.04] bg-white/[0.01]">
            <button
              onClick={() => setCreated(null)}
              className="h-9 px-4 rounded-lg bg-white/[0.04] text-white text-xs font-semibold border border-white/[0.06]"
            >
              Done
            </button>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.type === 'rotate' ? 'Rotate this key?' : 'Revoke this key?'}
        message={
          confirm?.type === 'rotate'
            ? 'A new key is issued immediately and the old one is revoked after a short grace period. Update integrations promptly.'
            : 'Revoking permanently disables this key. Any integration using it will stop working.'
        }
        confirmLabel={confirm?.type === 'rotate' ? 'Rotate' : 'Revoke'}
        destructive={confirm?.type === 'revoke'}
        busy={busy}
        onConfirm={() => {
          if (!confirm) return;
          if (confirm.type === 'rotate')
            runAction(
              () => keysApi.rotate(confirm.key.id, 3600),
              (r) => setCreated(r as CreatedKey),
            );
          else runAction(() => keysApi.revoke(confirm.key.id));
        }}
        onCancel={() => setConfirm(null)}
      />
    </DashboardLayout>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0b0b0b] border border-white/[0.08] w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.04]">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/5 rounded-lg text-white/50 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs text-white/50">{label}</span>
      {children}
    </div>
  );
}

function IconBtn({
  children,
  title,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`h-7 w-7 rounded-md flex items-center justify-center border transition-colors ${
        danger
          ? 'text-red-400 hover:bg-red-500/15 border-red-500/20'
          : 'text-white/50 hover:text-white hover:bg-white/[0.06] border-white/[0.06]'
      }`}
    >
      {children}
    </button>
  );
}
