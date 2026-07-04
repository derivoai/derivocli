/**
 * Derivo UI kit — premium-minimal primitives.
 *
 * Design language: near-black layered surfaces, ultra-soft hairlines, gentle
 * rounded corners (never squared, never pill-heavy), a single restrained
 * indigo accent, and quiet depth (faint top highlight + soft shadow). Inspired
 * by Linear / Vercel / Apple. Every page composes these for consistency.
 */
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

type Tone = 'accent' | 'good' | 'warn' | 'bad' | 'info' | 'neutral';

export const TONE_TILE: Record<Tone, string> = {
  accent: 'bg-accent/10 text-accent-bright border-accent/20',
  good: 'bg-good/10 text-good border-good/20',
  warn: 'bg-warn/10 text-warn border-warn/20',
  bad: 'bg-bad/10 text-bad border-bad/20',
  info: 'bg-info/10 text-info border-info/20',
  neutral: 'bg-white/[0.05] text-white/70 border-white/[0.08]',
};

export const TONE_DOT: Record<Tone, string> = {
  accent: 'bg-accent',
  good: 'bg-good',
  warn: 'bg-warn',
  bad: 'bg-bad',
  info: 'bg-info',
  neutral: 'bg-white/40',
};

export type { Tone };

/* ── Card ──────────────────────────────────────────────────────────────── */

export function Card({
  children,
  className = '',
  hover = false,
  as: As = 'div',
  ...rest
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  as?: any;
  [key: string]: any;
}) {
  return (
    <As
      className={`surface-card rounded-[18px] ${
        hover
          ? 'transition-all duration-300 hover:border-white/[0.16] hover:-translate-y-0.5 hover:shadow-[0_36px_72px_-32px_rgba(0,0,0,0.9)]'
          : ''
      } ${className}`}
      {...rest}
    >
      {children}
    </As>
  );
}

/* ── Section — a card with a soft header row ───────────────────────────── */

export function Section({
  children,
  title,
  actions,
  className = '',
  bodyClassName = 'p-6',
  flush = false,
}: {
  children: ReactNode;
  title?: string;
  actions?: ReactNode;
  className?: string;
  bodyClassName?: string;
  flush?: boolean;
}) {
  return (
    <div className={`surface-card rounded-[18px] overflow-hidden ${className}`}>
      {title && (
        <div className="flex items-center justify-between gap-3 px-6 h-14 border-b border-white/[0.06]">
          <span className="font-display text-sm font-semibold tracking-tight text-white/90">
            {title}
          </span>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}
      <div className={flush ? '' : bodyClassName}>{children}</div>
    </div>
  );
}

/* ── Icon tile ─────────────────────────────────────────────────────────── */

export function IconTile({
  children,
  tone = 'neutral',
  size = 'md',
  className = '',
}: {
  children: ReactNode;
  tone?: Tone;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const dims =
    size === 'sm'
      ? 'w-8 h-8 rounded-[10px]'
      : size === 'lg'
        ? 'w-12 h-12 rounded-2xl'
        : 'w-10 h-10 rounded-[14px]';
  return (
    <div
      className={`${dims} border flex items-center justify-center shrink-0 ${TONE_TILE[tone]} ${className}`}
    >
      {children}
    </div>
  );
}

/* ── Button ────────────────────────────────────────────────────────────── */

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';
type BtnSize = 'sm' | 'md';

const BTN_VARIANT: Record<BtnVariant, string> = {
  primary:
    'bg-white text-black hover:bg-white/90 border border-transparent shadow-[0_8px_22px_-10px_rgba(255,255,255,0.35)]',
  accent:
    'bg-white text-black hover:bg-white/90 border border-transparent shadow-[0_8px_22px_-10px_rgba(255,255,255,0.35)]',
  secondary: 'bg-white/[0.05] text-white hover:bg-white/[0.09] border border-white/[0.12]',
  ghost:
    'bg-transparent text-white/60 hover:text-white hover:bg-white/[0.06] border border-transparent',
  danger: 'bg-bad/10 text-bad hover:bg-bad/[0.18] border border-bad/25',
};

export const Btn = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: BtnVariant;
    size?: BtnSize;
    busy?: boolean;
    icon?: ReactNode;
  }
>(function Btn(
  { variant = 'secondary', size = 'md', busy, icon, children, className = '', disabled, ...rest },
  ref,
) {
  const dims =
    size === 'sm'
      ? 'h-8 px-3.5 text-xs rounded-[10px] gap-1.5'
      : 'h-9 px-4 text-[13px] rounded-xl gap-2';
  return (
    <button
      ref={ref}
      disabled={disabled || busy}
      className={`inline-flex items-center justify-center font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${dims} ${BTN_VARIANT[variant]} ${className}`}
      {...rest}
    >
      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : icon}
      {children}
    </button>
  );
});

/* ── Icon-only button ──────────────────────────────────────────────────── */

export function IconBtn({
  children,
  title,
  onClick,
  tone = 'neutral',
  disabled,
}: {
  children: ReactNode;
  title: string;
  onClick?: () => void;
  tone?: 'neutral' | 'bad';
  disabled?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`h-8 w-8 rounded-[10px] flex items-center justify-center border transition-colors disabled:opacity-40 ${
        tone === 'bad'
          ? 'text-bad/80 hover:text-bad hover:bg-bad/15 border-bad/20'
          : 'text-white/50 hover:text-white hover:bg-white/[0.07] border-white/[0.08]'
      }`}
    >
      {children}
    </button>
  );
}

/* ── Section label (soft eyebrow) ──────────────────────────────────────── */

export function SectionLabel({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`text-[11px] font-medium uppercase tracking-[0.14em] text-white/35 ${className}`}
    >
      {children}
    </span>
  );
}

/* ── Inputs ────────────────────────────────────────────────────────────── */

export function TextInput({
  className = '',
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full h-10 px-3.5 rounded-xl bg-canvas border border-white/[0.09] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 transition-colors ${className}`}
      {...rest}
    />
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  icon,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  icon: ReactNode;
}) {
  return (
    <div className="relative flex-1">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30">{icon}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-11 pl-10 pr-4 rounded-[14px] surface-card text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 transition-colors"
      />
    </div>
  );
}

/* ── Segmented control ─────────────────────────────────────────────────── */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-[14px] surface-card">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`h-8 px-3.5 rounded-[10px] text-xs font-medium transition-colors ${
            value === o.id ? 'bg-white/[0.1] text-white' : 'text-white/45 hover:text-white/85'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ── Field wrapper ─────────────────────────────────────────────────────── */

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-white/55">{label}</label>
      {children}
    </div>
  );
}

/* ── Divider ───────────────────────────────────────────────────────────── */

export function Divider({ className = '' }: { className?: string }) {
  return <div className={`h-px w-full bg-white/[0.07] ${className}`} />;
}

/* ── Key / value row ───────────────────────────────────────────────────── */

export function KV({
  label,
  children,
  mono,
}: {
  label: string;
  children: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="grid grid-cols-3 gap-3 items-center py-2.5 border-b border-white/[0.05] last:border-0">
      <span className="text-xs text-white/40">{label}</span>
      <span
        className={`col-span-2 text-sm text-white/90 ${mono ? 'font-mono break-all text-xs' : ''}`}
      >
        {children}
      </span>
    </div>
  );
}
