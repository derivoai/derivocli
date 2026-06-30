import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CommandLineProps {
  command: string;
  /** 'pill' for the rounded hero style, 'block' for full-width rows. */
  variant?: 'pill' | 'block';
  className?: string;
}

/**
 * A copy-to-clipboard command snippet. Used on the landing hero and across the
 * dashboard for install / CLI commands. Solid surfaces, no gradients.
 */
export function CommandLine({ command, variant = 'block', className = '' }: CommandLineProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — ignore */
    }
  };

  const shape =
    variant === 'pill' ? 'h-12 rounded-full pl-5 pr-2' : 'h-11 w-full rounded-lg pl-4 pr-2';

  return (
    <div
      className={`group inline-flex items-center gap-3 ${shape} bg-white/[0.03] border border-white/[0.1] font-mono text-sm transition-colors hover:border-white/20 ${className}`}
    >
      <span className="text-white/30 select-none">$</span>
      <span className="text-white/80 truncate flex-1">{command}</span>
      <button
        onClick={copy}
        aria-label={copied ? 'Copied' : 'Copy command'}
        className="shrink-0 h-8 w-8 rounded-md flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.08] transition-colors"
      >
        {copied ? (
          <Check className="w-4 h-4 text-emerald-400" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}
