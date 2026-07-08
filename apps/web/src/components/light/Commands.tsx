import { motion } from 'motion/react';
import { LogIn, Wrench, Stethoscope, ScanSearch, ShieldCheck, Blocks } from 'lucide-react';

const ease = [0.16, 1, 0.3, 1] as const;

const commands = [
  {
    cmd: 'derivo login',
    icon: LogIn,
    desc: 'Authenticate this machine with your account in one browser step.',
  },
  {
    cmd: 'derivo setup',
    icon: Wrench,
    desc: 'Detect your stack, fix runtime and service issues, and prepare the project.',
  },
  {
    cmd: 'derivo doctor',
    icon: Stethoscope,
    desc: 'Run full diagnostics on your machine and project. Add --fix to auto-repair.',
  },
  {
    cmd: 'derivo inspect',
    icon: ScanSearch,
    desc: 'Analyze project structure, surface risks, and get recommendations.',
  },
  {
    cmd: 'derivo validate',
    icon: ShieldCheck,
    desc: 'Check the project against best-practice rules and apply safe fixes.',
  },
  {
    cmd: 'derivo plugin',
    icon: Blocks,
    desc: 'Extend Derivo with framework-aware plugins for your workflow.',
  },
];

export function Commands() {
  return (
    <section className="w-full bg-background py-28 md:py-36 scroll-mt-20">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease }}
          className="max-w-2xl mb-14"
        >
          <span className="text-xs font-medium tracking-wide text-accent uppercase">
            Command reference
          </span>
          <h2 className="mt-3 font-display text-4xl md:text-5xl leading-[1.0] tracking-tight text-foreground">
            One CLI for the <span className="italic">whole</span> environment.
          </h2>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed max-w-xl">
            Every command is local-first and scriptable. Learn one tool instead of a dozen setup
            docs.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {commands.map((c, i) => {
            const Icon = c.icon;
            return (
              <motion.div
                key={c.cmd}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.06, ease }}
                className="group rounded-2xl border border-border bg-background p-6 hover:shadow-[0_12px_40px_-18px_rgba(0,0,0,0.12)] transition-shadow"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-foreground group-hover:bg-accent/10 group-hover:text-accent transition-colors">
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                  <code className="font-mono text-sm text-foreground">{c.cmd}</code>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
