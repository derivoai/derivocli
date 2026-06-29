import { AlertTriangle, RefreshCw } from 'lucide-react';
import type { ReactNode } from 'react';

/** Loading skeleton rows. */
export function SkeletonList({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-16 rounded-xl bg-white/[0.02] border border-white/[0.05] animate-pulse"
        />
      ))}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4 gap-4">
      <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
        <AlertTriangle className="w-6 h-6 text-red-400" />
      </div>
      <span className="text-sm text-white/60 max-w-md">{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="h-9 px-4 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-white/80 flex items-center gap-2 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center text-center py-12 px-4 gap-2">
      {icon && <div className="text-white/20 mb-1">{icon}</div>}
      <p className="text-sm text-white/60 font-medium">{title}</p>
      {description && <p className="text-xs text-white/40 max-w-md">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

/** A small refresh button for page headers. */
export function RefreshButton({ onClick, busy }: { onClick: () => void; busy?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      title="Refresh"
      className="h-9 w-9 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] transition-colors flex items-center justify-center text-white/60 disabled:opacity-50"
    >
      <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />
    </button>
  );
}
