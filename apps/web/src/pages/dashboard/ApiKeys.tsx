import { useMemo, useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/layout/DashboardLayout';
import { KeyRound, Plus, Search, Copy, RefreshCw, Ban, CheckCircle2, Trash2 } from 'lucide-react';
import { keysApi, type ApiKeyInfo, type CreatedKey } from '../../lib/api';
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
import {
  Card,
  Btn,
  IconBtn,
  SearchInput,
  Field,
  TextInput,
} from '../../components/dashboard/ui/kit';
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
        <PageHeader
          eyebrow="Access"
          title="API Keys"
          description="Programmatic access tokens for the Derivo API and CLI."
          actions={
            <div className="flex items-center gap-2.5">
              <RefreshButton onClick={refetch} busy={loading} />
              <Btn
                variant="accent"
                onClick={() => setCreating(true)}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                New Key
              </Btn>
            </div>
          }
        />

        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search keys..."
          icon={<Search className="w-4 h-4" />}
        />

        {loading ? (
          <SkeletonList rows={3} />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<KeyRound className="w-8 h-8" />}
            title={search ? 'No matching keys' : 'No API keys yet'}
            description="Create a key to authenticate programmatic access to the Derivo API."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((k) => (
              <Card key={k.id} className="p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-white/90">{k.name}</span>
                      <StatusBadge label={k.status} tone={statusTone(k.status)} />
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.05] text-white/40 border border-white/[0.08]">
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
                      tone="bad"
                      onClick={() => setConfirm({ type: 'revoke', key: k })}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </IconBtn>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-[11px] text-white/40 border-t border-white/[0.05] pt-2 flex-wrap">
                  <span>Created {formatDateTime(k.createdAt)}</span>
                  <span>Last used {relativeTime(k.lastUsedAt)}</span>
                  <span>Expires {k.expiresAt ? formatDateTime(k.expiresAt) : 'never'}</span>
                  {k.permissions.length > 0 && <span>Scopes: {k.permissions.join(', ')}</span>}
                  {k.tags.length > 0 && <span>Tags: {k.tags.join(', ')}</span>}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={creating}
        title="Create API Key"
        icon={<KeyRound className="w-4 h-4 text-accent-bright" />}
        onClose={() => setCreating(false)}
        footer={
          <>
            <Btn variant="secondary" onClick={() => setCreating(false)}>
              Cancel
            </Btn>
            <Btn variant="accent" onClick={submitCreate} busy={busy} disabled={!name.trim()}>
              Create Key
            </Btn>
          </>
        }
      >
        <div className="p-6 space-y-4">
          <Field label="Name">
            <TextInput
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. CI deploy key"
            />
          </Field>
          <Field label="Environment">
            <div className="flex gap-2">
              {(['live', 'test'] as const).map((env) => (
                <button
                  key={env}
                  onClick={() => setEnvironment(env)}
                  className={`h-9 px-4 rounded-[10px] text-xs font-medium border transition-colors ${
                    environment === env
                      ? 'bg-accent/15 text-accent-bright border-accent/30'
                      : 'bg-white/[0.04] text-white/60 border-white/[0.08]'
                  }`}
                >
                  {env}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Permissions">
            <div className="flex flex-wrap gap-2">
              {SCOPES.map((scope) => {
                const on = permissions.includes(scope);
                return (
                  <button
                    key={scope}
                    onClick={() =>
                      setPermissions((p) => (on ? p.filter((s) => s !== scope) : [...p, scope]))
                    }
                    className={`h-7 px-2.5 rounded-lg text-[11px] font-mono border transition-colors ${
                      on
                        ? 'bg-info/15 text-info border-info/25'
                        : 'bg-white/[0.04] text-white/50 border-white/[0.08]'
                    }`}
                  >
                    {scope}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="Tags (comma-separated)">
            <TextInput
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="ci, production"
            />
          </Field>
        </div>
      </Modal>

      <Modal
        open={!!created}
        title="API Key Created"
        icon={<CheckCircle2 className="w-4 h-4 text-good" />}
        onClose={() => setCreated(null)}
        footer={
          <Btn variant="secondary" onClick={() => setCreated(null)}>
            Done
          </Btn>
        }
      >
        {created && (
          <div className="p-6 space-y-4">
            <div className="px-4 py-3 rounded-xl bg-warn/10 border border-warn/20 text-xs text-warn">
              Copy this key now — it will not be shown again.
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs font-mono text-white bg-canvas border border-white/[0.08] rounded-xl px-3 py-2.5 break-all">
                {created.key}
              </code>
              <Btn
                variant="primary"
                onClick={() => {
                  navigator.clipboard?.writeText(created.key);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                icon={
                  copied ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )
                }
                className="shrink-0"
              >
                {copied ? 'Copied' : 'Copy'}
              </Btn>
            </div>
          </div>
        )}
      </Modal>

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
