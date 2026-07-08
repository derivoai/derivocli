import { Check, TriangleAlert, Copy } from 'lucide-react';

const ACCENT = 'hsl(239 84% 67%)';

const lines: { type: 'cmd' | 'ok' | 'warn'; text: string; meta?: string }[] = [
  { type: 'cmd', text: 'derivo setup' },
  { type: 'ok', text: 'Node.js updated to v22.3.0', meta: 'nvm' },
  { type: 'ok', text: 'Docker engine active and ready', meta: 'daemon' },
  { type: 'warn', text: 'Redis not responding — provisioning…', meta: 'docker' },
  { type: 'ok', text: 'Redis bound to port 6379', meta: 'docker' },
  { type: 'ok', text: 'Environment verified', meta: 'derivo.json' },
];

export function DerivoPreview() {
  return (
    <div className="select-none pointer-events-none rounded-2xl overflow-hidden bg-background border border-border shadow-[0_20px_60px_-24px_rgba(0,0,0,0.18)]">
      {/* Window bar */}
      <div className="flex items-center gap-2 px-5 h-11 border-b border-border bg-secondary/50">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-border" />
          <span className="h-3 w-3 rounded-full bg-border" />
          <span className="h-3 w-3 rounded-full bg-border" />
        </div>
        <div className="flex-1 text-center text-muted-foreground font-mono tracking-widest uppercase text-[10px]">
          derivo — zsh
        </div>
        <div className="flex items-center text-muted-foreground">
          <Copy className="h-3.5 w-3.5" />
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-5 md:px-7 md:py-6 font-mono text-xs bg-background">
        {/* Prompt line */}
        <div className="flex items-center gap-2 text-foreground font-semibold">
          <span className="text-accent">$</span>
          <span>derivo setup</span>
        </div>

        {/* Status lines */}
        <div className="mt-4 flex flex-col divide-y divide-border/60">
          {lines
            .filter((line) => line.type !== 'cmd')
            .map((line, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {line.type === 'ok' ? (
                    <span
                      className="h-4 w-4 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: 'rgba(16,185,129,0.12)' }}
                    >
                      <Check className="h-2.5 w-2.5 text-emerald-600" />
                    </span>
                  ) : (
                    <span
                      className="h-4 w-4 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: 'rgba(245,158,11,0.14)' }}
                    >
                      <TriangleAlert className="h-2.5 w-2.5 text-amber-600" />
                    </span>
                  )}
                  <span
                    className={`truncate ${line.type === 'ok' ? 'text-foreground' : 'text-amber-700'}`}
                  >
                    {line.text}
                  </span>
                </div>
                {line.meta && (
                  <span className="shrink-0 text-[9px] uppercase tracking-widest text-muted-foreground tabular-nums">
                    {line.meta}
                  </span>
                )}
              </div>
            ))}
        </div>
      </div>

      {/* Readiness bar */}
      <div className="px-6 md:px-7 py-4 border-t border-border bg-secondary/40">
        <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
          <span>Environment Readiness</span>
          <span className="text-foreground">100%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
          <div className="h-full w-full rounded-full" style={{ backgroundColor: ACCENT }} />
        </div>
      </div>
    </div>
  );
}
