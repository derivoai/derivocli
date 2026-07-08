import { motion } from 'motion/react';
import { HardDrive, Lock, MonitorSmartphone, KeyRound } from 'lucide-react';

const ease = [0.16, 1, 0.3, 1] as const;

const points = [
  {
    icon: HardDrive,
    title: 'Local-first by design',
    desc: 'Your source code never leaves your machine. Derivo reads only structural manifests to understand your stack.',
  },
  {
    icon: Lock,
    title: 'Encrypted, machine-bound sessions',
    desc: 'Credentials are encrypted at rest with AES-256-GCM and tied to your device — a copied session file is useless elsewhere.',
  },
  {
    icon: MonitorSmartphone,
    title: 'Device trust & session control',
    desc: 'See every active session and registered device. Trust, review, or sign them out from your dashboard anytime.',
  },
  {
    icon: KeyRound,
    title: 'Scoped, revocable API keys',
    desc: 'Issue keys for CI and automation with limited scopes, and revoke them the instant they are no longer needed.',
  },
];

export function Security() {
  return (
    <section className="w-full bg-secondary/30 border-y border-border py-28 md:py-36">
      <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-[0.9fr_1.1fr] gap-12 md:gap-16 items-start">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease }}
        >
          <span className="text-xs font-medium tracking-wide text-accent uppercase">Security</span>
          <h2 className="mt-3 font-display text-4xl md:text-5xl leading-[1.0] tracking-tight text-foreground">
            Built to be <span className="italic">trusted</span> on every machine.
          </h2>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed">
            Derivo runs close to your code without taking it. Security is the default, not an
            add-on.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-4">
          {points.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: i * 0.06, ease }}
                className="rounded-2xl border border-border bg-background p-6 hover:border-accent/40 transition-colors"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-foreground mb-4">
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <h3 className="text-sm font-semibold text-foreground">{p.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
