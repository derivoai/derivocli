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
      className={`group inline-flex items-center gap-3 ${shape} bg-secondary/50 border border-border font-mono text-sm transition-colors hover:border-accent ${className}`}
    >
      <span className="text-muted-foreground select-none">$</span>
      <span className="text-foreground/80 truncate flex-1">{command}</span>
      <button
        onClick={copy}
        aria-label={copied ? 'Copied' : 'Copy command'}
        className="shrink-0 h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
      >
        {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
}
