import { motion } from 'motion/react';
import { GitBranch, Server, Plug, FileKey2, Container, Database } from 'lucide-react';

const ease = [0.16, 1, 0.3, 1] as const;

const items = [
  {
    icon: GitBranch,
    q: 'Wrong Node version?',
    a: 'Matched automatically.',
    d: 'Aligns local runtimes with your .nvmrc or package.json the moment you enter the project.',
  },
  {
    icon: Server,
    q: "Redis isn't running?",
    a: 'Diagnosed and started.',
    d: 'Pinpoints missing binaries, network issues, or config conflicts, then launches it in the background.',
  },
  {
    icon: Plug,
    q: 'Port already in use?',
    a: 'Blocking process freed.',
    d: 'Finds the stale Node or Docker process holding port 3000 and releases it in one step.',
  },
  {
    icon: FileKey2,
    q: 'Missing .env config?',
    a: 'Generated instantly.',
    d: 'Fills missing local variables from team-approved templates and secure placeholders.',
  },
  {
    icon: Container,
    q: 'Docker daemon down?',
    a: 'Booted in the background.',
    d: 'Detects inactive engines, initializes the service safely, and handles container status.',
  },
  {
    icon: Database,
    q: 'Stale database schema?',
    a: 'Synced and seeded.',
    d: 'Runs isolated migrations and seeds mock records so local matches the main branch.',
  },
];

export function Features() {
  return (
    <section id="features" className="w-full bg-background py-28 md:py-36 scroll-mt-20">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease }}
          className="max-w-2xl mb-16"
        >
          <span className="text-xs font-medium tracking-wide text-accent uppercase">
            Interactive diagnostics
          </span>
          <h2 className="mt-3 font-display text-4xl md:text-5xl leading-[1.0] tracking-tight text-foreground">
            We don't just report errors. <span className="italic">We fix them.</span>
          </h2>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed max-w-xl">
            Derivo continuously watches your local environment and resolves everyday friction before
            you open your browser.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.q}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.06, ease }}
                className="rounded-2xl border border-border bg-background p-6 hover:shadow-[0_12px_40px_-18px_rgba(0,0,0,0.12)] transition-shadow"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-foreground mb-5">
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <h3 className="text-base font-semibold text-foreground">{item.q}</h3>
                <p className="text-base font-medium text-accent mt-0.5">{item.a}</p>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{item.d}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
