import { motion } from 'motion/react';
import { Users, GitCompareArrows, Boxes } from 'lucide-react';

const ease = [0.16, 1, 0.3, 1] as const;

const cases = [
  {
    icon: Users,
    title: 'Onboard new hires in minutes',
    desc: 'A new engineer clones the repo, runs one command, and has a verified environment before their first standup — no tribal knowledge required.',
  },
  {
    icon: GitCompareArrows,
    title: 'Keep local in sync with CI',
    desc: 'Derivo validates runtimes, services, and env against the project’s source of truth, so “works on my machine” stops being a debugging session.',
  },
  {
    icon: Boxes,
    title: 'Tame polyglot monorepos',
    desc: 'Detects frameworks, package managers, and workspaces across apps and packages, and provisions exactly what each one needs.',
  },
];

export function UseCases() {
  return (
    <section className="w-full bg-background py-28 md:py-36">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease }}
          className="max-w-2xl mb-14"
        >
          <span className="text-xs font-medium tracking-wide text-accent uppercase">Use cases</span>
          <h2 className="mt-3 font-display text-4xl md:text-5xl leading-[1.0] tracking-tight text-foreground">
            Built for how <span className="italic">teams</span> actually work.
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-4">
          {cases.map((c, i) => {
            const Icon = c.icon;
            return (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.08, ease }}
                className="rounded-2xl border border-border bg-background p-7 hover:border-accent/40 transition-colors"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent mb-5">
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <h3 className="text-base font-semibold text-foreground">{c.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
