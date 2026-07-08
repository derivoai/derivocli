import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  eyebrow?: string;
}

/** Clean, spacious page header. API-compatible (title/description/actions/eyebrow). */
export function PageHeader({ title, description, actions, eyebrow }: PageHeaderProps) {
  return (
    <header className="flex flex-col md:flex-row md:items-end justify-between gap-5">
      <div className="flex flex-col gap-2">
        {eyebrow && (
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {eyebrow}
          </span>
        )}
        <h1 className="text-[28px] md:text-[34px] font-semibold tracking-[-0.02em] text-foreground leading-none">
          {title}
        </h1>
        {description && <p className="text-sm text-muted-foreground max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2.5 shrink-0">{actions}</div>}
    </header>
  );
}
