import { motion } from 'motion/react';

const ease = [0.16, 1, 0.3, 1] as const;

const tech = [
  { name: 'Node.js', type: 'Runtime' },
  { name: 'Bun', type: 'Runtime' },
  { name: 'Docker', type: 'Containers' },
  { name: 'PostgreSQL', type: 'Database' },
  { name: 'Redis', type: 'Cache' },
  { name: 'Next.js', type: 'Framework' },
  { name: 'React', type: 'Frontend' },
  { name: 'NestJS', type: 'Backend' },
  { name: 'Prisma', type: 'ORM' },
  { name: 'pnpm', type: 'Package manager' },
  { name: 'Tailwind', type: 'Styling' },
  { name: 'TypeScript', type: 'Language' },
];

const stats: [string, string][] = [
  ['12+', 'Runtimes & tools'],
  ['0', 'Config changes'],
  ['1', 'Command to boot'],
];

const marquee = [...tech, ...tech];

export function Ecosystem() {
  return (
    <section className="w-full bg-secondary/30 py-28 md:py-32 border-y border-border">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-14">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease }}
            className="max-w-xl"
          >
            <span className="text-xs font-medium tracking-wide text-accent uppercase">
              Ecosystem
            </span>
            <h2 className="mt-3 font-display text-4xl md:text-5xl leading-[1.0] tracking-tight text-foreground">
              Works with your <span className="italic">favorite</span> stack.
            </h2>
            <p className="mt-4 text-base text-muted-foreground leading-relaxed">
              Derivo reads your existing config files and provisions the tools you already use — no
              rewrites, no lock-in.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, delay: 0.1, ease }}
            className="flex gap-8 shrink-0"
          >
            {stats.map(([v, l]) => (
              <div key={l} className="flex flex-col">
                <span className="font-display text-4xl text-foreground leading-none">{v}</span>
                <span className="mt-1 text-xs text-muted-foreground">{l}</span>
              </div>
            ))}
          </motion.div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {tech.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -3 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: i * 0.04, ease }}
              className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3 hover:border-accent/40 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                <span className="text-sm font-medium text-foreground">{t.name}</span>
              </div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {t.type}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Marquee strip */}
      <div
        className="mt-14 relative overflow-hidden"
        style={{
          maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
          WebkitMaskImage:
            'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
        }}
      >
        <div className="flex gap-3 w-max" style={{ animation: 'lm-marquee 32s linear infinite' }}>
          {marquee.map((t, i) => (
            <div
              key={`${t.name}-${i}`}
              className="flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 whitespace-nowrap"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-accent/60" />
              <span className="text-xs font-medium text-muted-foreground">{t.name}</span>
            </div>
          ))}
        </div>
        <style>{`
          @keyframes lm-marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
          @media (prefers-reduced-motion: reduce) { .flex.gap-3.w-max { animation: none !important; } }
        `}</style>
      </div>
    </section>
  );
}
