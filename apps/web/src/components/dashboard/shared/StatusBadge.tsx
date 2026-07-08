/**
 * StatusBadge — a soft pill that always pairs tone color with a text label
 * (never color alone). Tone keys kept stable (green|amber|red|blue|gray).
 */
type Tone = 'green' | 'amber' | 'red' | 'blue' | 'gray';

const TONES: Record<Tone, string> = {
  green: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  amber: 'bg-amber-100 text-amber-700 border-amber-200',
  red: 'bg-red-100 text-red-700 border-red-200',
  blue: 'bg-blue-100 text-blue-700 border-blue-200',
  gray: 'bg-secondary text-muted-foreground border-border',
};

const DOTS: Record<Tone, string> = {
  green: 'bg-emerald-600',
  amber: 'bg-amber-600',
  red: 'bg-red-600',
  blue: 'bg-blue-600',
  gray: 'bg-muted-foreground',
};

export function StatusBadge({
  label,
  tone = 'gray',
  dot = true,
}: {
  label: string;
  tone?: Tone;
  dot?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 pl-2 pr-2.5 py-1 rounded-full border text-[11px] font-medium capitalize ${TONES[tone]}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${DOTS[tone]}`} />}
      {label}
    </span>
  );
}

export type { Tone };
