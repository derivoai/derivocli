type Tone = 'green' | 'amber' | 'red' | 'blue' | 'gray';

const TONES: Record<Tone, string> = {
  green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  red: 'bg-red-500/10 text-red-400 border-red-500/20',
  blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  gray: 'bg-white/[0.04] text-white/50 border-white/[0.08]',
};

const DOTS: Record<Tone, string> = {
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  blue: 'bg-blue-500',
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
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-medium ${TONES[tone]}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${DOTS[tone]}`} />}
      {label}
    </span>
  );
}

export type { Tone };
