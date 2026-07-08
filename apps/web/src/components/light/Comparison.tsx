import { motion } from 'motion/react';
import { X, Check, Clock } from 'lucide-react';

const ease = [0.16, 1, 0.3, 1] as const;

const oldWay = [
  'Read a 400-line onboarding README',
  'Install the right Node version by hand',
  'Debug why Docker won’t start',
  'Hunt for missing .env values',
  'Ask a teammate why the database is empty',
];

const newWay = [
  'Runtimes matched to the project',
  'Docker & services started for you',
  '.env generated from templates',
  'Database migrated and seeded',
  'Conflicting ports freed automatically',
];

export function Comparison() {
  return (
    <section className="w-full bg-secondary/30 py-28 md:py-36 border-y border-border">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease }}
          className="max-w-2xl mb-14"
        >
          <span className="text-xs font-medium tracking-wide text-accent uppercase">
            Why Derivo
          </span>
          <h2 className="mt-3 font-display text-4xl md:text-5xl leading-[1.0] tracking-tight text-foreground">
            Onboarding, without the <span className="italic">marathon</span>.
          </h2>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed max-w-xl">
            The same repository, two very different first days. Derivo turns a checklist of
            environment chores into a single command.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Old way */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, ease }}
            className="rounded-2xl border border-border bg-background p-7"
          >
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm font-semibold text-foreground">The old way</span>
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                ~2 hours
              </span>
            </div>
            <ul className="flex flex-col gap-3.5">
              {oldWay.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <span className="mt-0.5 h-4 w-4 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <X className="h-2.5 w-2.5 text-muted-foreground" />
                  </span>
                  <span className="line-through decoration-border">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* With Derivo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: 0.1, ease }}
            className="rounded-2xl border-2 border-accent bg-background p-7"
          >
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm font-semibold text-foreground">With Derivo</span>
              <span className="inline-flex items-center gap-1.5 text-xs text-accent font-medium">
                <Clock className="h-3.5 w-3.5" />
                ~30 seconds
              </span>
            </div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 font-mono text-xs text-foreground">
              <span className="text-accent">$</span>
              derivo setup
            </div>
            <ul className="flex flex-col gap-3.5">
              {newWay.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-foreground">
                  <span
                    className="mt-0.5 h-4 w-4 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: 'rgba(99,102,241,0.12)' }}
                  >
                    <Check className="h-2.5 w-2.5 text-accent" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
