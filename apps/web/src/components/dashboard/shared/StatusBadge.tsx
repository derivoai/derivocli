/**
 * StatusBadge — a soft pill that always pairs tone color with a text label
 * (never color alone). Tone keys kept stable (green|amber|red|blue|gray).
 */
type Tone = 'green' | 'amber' | 'red' | 'blue' | 'gray';

const TONES: Record<Tone, string> = {
  green: 'bg-good/10 text-good border-good/20',
  amber: 'bg-warn/10 text-warn border-warn/20',
  red: 'bg-bad/10 text-bad border-bad/20',
  blue: 'bg-info/10 text-info border-info/20',
  gray: 'bg-white/[0.05] text-white/55 border-white/[0.1]',
};

const DOTS: Record<Tone, string> = {
  green: 'bg-good',
  amber: 'bg-warn',
  red: 'bg-bad',
  blue: 'bg-info',
  gray: 'bg-white/40',
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
