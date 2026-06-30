import { motion } from 'motion/react';
import { Lock, HardDrive, MonitorSmartphone, KeyRound } from 'lucide-react';

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
    <section className="w-full max-w-5xl mx-auto px-6 mt-40 relative z-10 text-left">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-12 border-t border-white/[0.08] pt-16">
        <div className="md:w-1/3">
          <span className="text-[11px] font-mono tracking-widest text-white/30 uppercase">
            Security
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mt-3 leading-[1.1]">
            Built to be trusted on every machine.
          </h2>
          <p className="mt-4 text-sm text-white/60 leading-relaxed font-light">
            Derivo runs close to your code without taking it. Security is the default, not an
            add-on.
          </p>
        </div>

        <div className="md:w-2/3 grid sm:grid-cols-2 gap-4 w-full">
          {points.map((p, idx) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: idx * 0.06, ease: [0.16, 1, 0.3, 1] }}
                className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-white/[0.14] transition-colors duration-300"
              >
                <span className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white/60 mb-4">
                  <Icon className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-semibold text-white">{p.title}</h3>
                <p className="mt-1.5 text-sm text-white/45 leading-relaxed font-light">{p.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
