import { useMemo, useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/layout/DashboardLayout';
import {
  Activity as ActivityIcon,
  Search,
  LogIn,
  LogOut,
  RefreshCw,
  MonitorSmartphone,
  ShieldAlert,
  KeyRound,
} from 'lucide-react';
import { historyApi, type LoginHistoryEvent } from '../../lib/api';
import { useApiQuery } from '../../hooks/useApi';
import {
  EmptyState,
  ErrorState,
  RefreshButton,
  SkeletonList,
} from '../../components/dashboard/shared/States';
import { PageHeader } from '../../components/dashboard/shared/PageHeader';
import { relativeTime, formatDateTime } from '../../lib/relative-time';

const TYPE_META: Record<string, { label: string; icon: typeof LogIn; tone: string }> = {
  login: { label: 'Signed in', icon: LogIn, tone: 'text-emerald-400 bg-emerald-500/10' },
  logout: { label: 'Signed out', icon: LogOut, tone: 'text-white/60 bg-white/[0.06]' },
  logout_all: {
    label: 'Logged out all sessions',
    icon: ShieldAlert,
    tone: 'text-amber-400 bg-amber-500/10',
  },
  refresh: { label: 'Session refreshed', icon: RefreshCw, tone: 'text-blue-400 bg-blue-500/10' },
  refresh_failed: {
    label: 'Refresh failed',
    icon: ShieldAlert,
    tone: 'text-red-400 bg-red-500/10',
  },
  device_registered: {
    label: 'Device registered',
    icon: MonitorSmartphone,
    tone: 'text-blue-400 bg-blue-500/10',
  },
  token_revoked: { label: 'Token revoked', icon: ShieldAlert, tone: 'text-red-400 bg-red-500/10' },
};

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'auth', label: 'Auth', types: ['login', 'logout', 'logout_all', 'refresh'] },
  { id: 'security', label: 'Security', types: ['refresh_failed', 'token_revoked'] },
  { id: 'devices', label: 'Devices', types: ['device_registered'] },
];

const PAGE_SIZE = 15;

export function Activity() {
  const { data, loading, error, refetch } = useApiQuery(() => historyApi.list(), []);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);

  const events = data?.history ?? [];

  const filtered = useMemo(() => {
    const def = FILTERS.find((f) => f.id === filter);
    return events.filter((e) => {
      if (def?.types && !def.types.includes(e.type)) return false;
      if (search) {
        const hay = `${e.type} ${e.detail ?? ''} ${e.deviceId ?? ''}`.toLowerCase();
        if (!hay.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [events, filter, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <PageHeader
          title="Activity"
          description="Authentication, session, and security events on your account."
          actions={<RefreshButton onClick={refetch} busy={loading} />}
        />

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search events..."
              className="w-full h-9 pl-9 pr-4 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-white/20"
            />
          </div>
          <div className="flex gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  setFilter(f.id);
                  setPage(1);
                }}
                className={`h-9 px-3 rounded-lg text-xs font-medium border transition-colors ${
                  filter === f.id
                    ? 'bg-white/[0.08] text-white border-white/[0.12]'
                    : 'bg-white/[0.02] text-white/50 border-white/[0.06] hover:text-white/80'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <SkeletonList rows={5} />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : pageItems.length === 0 ? (
          <EmptyState
            icon={<ActivityIcon className="w-10 h-10" />}
            title={search || filter !== 'all' ? 'No matching events' : 'No activity yet'}
            description="Events appear as you sign in, register devices, and manage keys."
          />
        ) : (
          <div className="relative flex flex-col">
            {pageItems.map((e, i) => (
              <TimelineRow key={e.id} event={e} last={i === pageItems.length - 1} />
            ))}
          </div>
        )}

        {pageCount > 1 && (
          <div className="flex items-center justify-between text-xs text-white/50">
            <span>
              Page {page} of {pageCount} · {filtered.length} events
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="h-8 px-3 rounded-lg border border-white/[0.06] bg-white/[0.02] disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= pageCount}
                onClick={() => setPage((p) => p + 1)}
                className="h-8 px-3 rounded-lg border border-white/[0.06] bg-white/[0.02] disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function TimelineRow({ event, last }: { event: LoginHistoryEvent; last: boolean }) {
  const meta = TYPE_META[event.type] ?? {
    label: event.type,
    icon: KeyRound,
    tone: 'text-white/60 bg-white/[0.06]',
  };
  const Icon = meta.icon;
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${meta.tone}`}
        >
          <Icon className="w-4 h-4" />
        </div>
        {!last && <div className="w-px flex-1 bg-white/[0.06] my-1" />}
      </div>
      <div className="pb-6 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-white/90">{meta.label}</span>
          <span className="text-xs text-white/40" title={formatDateTime(event.at)}>
            {relativeTime(event.at)}
          </span>
        </div>
        {(event.detail || event.deviceId) && (
          <p className="text-xs text-white/45 mt-0.5">
            {event.detail}
            {event.detail && event.deviceId ? ' · ' : ''}
            {event.deviceId ? `device ${event.deviceId}` : ''}
          </p>
        )}
      </div>
    </div>
  );
}
