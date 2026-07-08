import { motion } from 'motion/react';

const ease = [0.16, 1, 0.3, 1] as const;

const steps = [
  {
    n: '01',
    title: 'Clone the repository',
    desc: 'Pull down your code as normal. No special templates or configuration wrappers required.',
    cmd: 'git clone git@github.com:org/app.git',
  },
  {
    n: '02',
    title: 'Run derivo setup',
    desc: 'The local agent scans your manifests and reads structural service parameters.',
    cmd: 'derivo setup',
  },
  {
    n: '03',
    title: 'Environment aligned',
    desc: 'Runtimes installed, .env resolved, databases seeded, and conflicting ports freed.',
  },
  {
    n: '04',
    title: 'Start coding',
    desc: 'Your workspace is verified and fully configured. Open your editor and ship.',
    cmd: 'npm run dev',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="w-full bg-secondary/40 py-28 md:py-36 scroll-mt-20">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease }}
          className="max-w-2xl mb-16"
        >
          <span className="text-xs font-medium tracking-wide text-accent uppercase">
            The protocol
          </span>
          <h2 className="mt-3 font-display text-4xl md:text-5xl leading-[1.0] tracking-tight text-foreground">
            From clone to container in <span className="italic">seconds</span>.
          </h2>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed max-w-xl">
            Say goodbye to stale wiki guides and day-one onboarding debugging marathons.
          </p>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-2">
          {steps.map((step, i) => (
            <motion.div
              key={step.n}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.08, ease }}
              className="rounded-2xl border border-border bg-background p-7"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-mono">
                  {step.n}
                </span>
                <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              {step.cmd && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 font-mono text-xs text-foreground">
                  <span className="text-muted-foreground">$</span>
                  {step.cmd}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
