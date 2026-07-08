import { AlertTriangle, RefreshCw } from 'lucide-react';
import type { ReactNode } from 'react';
import { Btn, IconTile } from '../ui/kit';

/** Loading skeleton rows — shaped like real list rows (icon + 2 lines). */
export function SkeletonList({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 bg-background border border-border rounded-[18px] p-4"
        >
          <div className="w-10 h-10 rounded-[14px] bg-secondary animate-pulse shrink-0" />
          <div className="flex flex-col gap-2 flex-1">
            <div className="h-3 w-1/3 bg-secondary animate-pulse rounded-lg" />
            <div className="h-2.5 w-1/2 bg-secondary animate-pulse rounded-lg" />
          </div>
          <div className="h-6 w-16 rounded-full bg-secondary animate-pulse" />
        </div>
      ))}
    </div>
  );
}

/** Block skeletons for card grids. */
export function SkeletonCards({ count = 3, height = 'h-32' }: { count?: number; height?: string }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4" aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`${height} bg-background border border-border rounded-[18px] p-5`}>
          <div className="h-3 w-1/2 bg-secondary animate-pulse rounded-lg mb-4" />
          <div className="h-6 w-1/3 bg-secondary animate-pulse rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="bg-background border border-border rounded-[18px] flex flex-col items-center justify-center text-center py-16 px-4 gap-4">
      <IconTile tone="bad" size="lg">
        <AlertTriangle className="w-5 h-5" />
      </IconTile>
      <span className="text-sm text-muted-foreground max-w-md">{message}</span>
      {onRetry && (
        <Btn
          variant="secondary"
          size="sm"
          onClick={onRetry}
          icon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Retry
        </Btn>
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
    <div className="col-span-full bg-background border border-border rounded-[18px] border-dashed flex flex-col items-center justify-center text-center py-16 px-4 gap-3">
      {icon && (
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl border border-border bg-secondary/50 text-muted-foreground mb-1">
          {icon}
        </div>
      )}
      <p className="text-sm text-foreground font-medium">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground max-w-md leading-relaxed">{description}</p>
      )}
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
      className="h-9 w-9 rounded-xl border border-border bg-background hover:bg-secondary transition-colors flex items-center justify-center text-muted-foreground disabled:opacity-50"
    >
      <RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} />
    </button>
  );
}
