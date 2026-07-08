import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Check, Copy } from 'lucide-react';

const ease = [0.16, 1, 0.3, 1] as const;

export function CTA() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText('npm install -g derivo');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <section className="w-full bg-background py-28 md:py-36">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7, ease }}
          className="rounded-3xl bg-primary text-primary-foreground px-8 py-16 md:px-16 md:py-20 text-center"
        >
          <h2 className="font-display text-4xl md:text-6xl leading-[0.98] tracking-tight">
            Code. Not <span className="italic">configuration</span>.
          </h2>
          <p className="mt-5 text-base md:text-lg text-primary-foreground/70 max-w-lg mx-auto leading-relaxed">
            Eliminate onboarding friction for good. Install the local-first CLI and have any
            repository running in seconds.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button className="rounded-full bg-background text-foreground px-6 py-3 text-sm font-medium hover:bg-background/90 transition-colors flex items-center gap-2 group">
              Get started free
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={copy}
              className="rounded-full border border-primary-foreground/20 px-5 py-3 font-mono text-sm text-primary-foreground/90 hover:bg-primary-foreground/10 transition-colors flex items-center gap-3"
            >
              <span className="text-primary-foreground/40">$</span>
              npm install -g derivo
              {copied ? (
                <Check className="h-4 w-4 text-emerald-400" />
              ) : (
                <Copy className="h-4 w-4 text-primary-foreground/50" />
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
