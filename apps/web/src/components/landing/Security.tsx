import { Lock, HardDrive, MonitorSmartphone, KeyRound } from 'lucide-react';
import { motion } from 'motion/react';
import { SectionHeading } from './SectionHeading';

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
    desc: 'See every active session and registered device. Trust, review, or sign them out from your dashboard at any time.',
  },
  {
    icon: KeyRound,
    title: 'Scoped, revocable API keys',
    desc: 'Issue keys for CI and automation with limited scopes, and revoke them instantly the moment they are no longer needed.',
  },
];

export function Security() {
  return (
    <section className="w-full max-w-5xl mx-auto px-6 mt-40 relative z-10">
      <SectionHeading
        eyebrow="Security"
        title="Built to be trusted on every machine."
        subtitle="Derivo runs close to your code without taking it. Security is the default, not an add-on."
      />

      <div className="grid sm:grid-cols-2 gap-x-12 gap-y-14 max-w-3xl mx-auto text-center">
        {points.map((p, idx) => {
          const Icon = p.icon;
          return (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }}
              whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.7, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="group flex flex-col items-center"
            >
              <span className="relative w-14 h-14 rounded-full bg-white/[0.04] border border-white/[0.1] flex items-center justify-center text-white/70 group-hover:text-white group-hover:border-white/[0.2] transition-colors duration-300">
                <span
                  aria-hidden
                  className="absolute -inset-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background:
                      'radial-gradient(circle, rgba(129,140,248,0.3) 0%, transparent 70%)',
                    filter: 'blur(10px)',
                  }}
                />
                <Icon className="relative w-5 h-5" />
              </span>
              <h3 className="mt-5 text-sm font-semibold text-white">{p.title}</h3>
              <p className="mt-2 text-sm text-white/45 leading-relaxed font-light max-w-xs">
                {p.desc}
              </p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
