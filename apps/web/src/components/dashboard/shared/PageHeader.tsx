import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

/** Consistent page header used across all dashboard pages. */
export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">{title}</h1>
        {description && <p className="text-sm text-white/55">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </header>
  );
}
