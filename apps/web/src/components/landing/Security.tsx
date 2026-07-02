import { motion } from 'motion/react';
import { Shield, Lock, Laptop, KeyRound, CheckCircle2 } from 'lucide-react';

interface SecurityStep {
  label: string;
  title: string;
  desc: string;
  icon: any;
}

const securitySteps: SecurityStep[] = [
  {
    label: '01 / Trusted Device',
    title: 'Hardware-Bound Signature',
    desc: 'Session keys are cryptographically bound to your specific hardware profile. Copied credential files are completely invalid on other machines.',
    icon: Laptop,
  },
  {
    label: '02 / Encrypted Session',
    title: 'AES-256-GCM Local Vault',
    desc: 'Local configuration and secrets are encrypted at rest with military-grade AES-256-GCM vault storage. Never saved in plaintext.',
    icon: Lock,
  },
  {
    label: '03 / Verified Identity',
    title: 'Secure Handshake Protocol',
    desc: 'Authenticates machines using a short-lived cryptographic authorization code exchanged during your secure browser-based login.',
    icon: CheckCircle2,
  },
  {
    label: '04 / Secure API Keys',
    title: 'Scoped & Revocable Access',
    desc: 'Issue isolated access tokens with strict action boundaries for CI/CD and automation. Revoke them instantly with a single click.',
    icon: KeyRound,
  },
  {
    label: '05 / Protected Workspace',
    title: 'Local-First Architecture',
    desc: 'Your repository source code never leaves your local environment. Derivo parses manifests on-machine and only reports status signals.',
    icon: Shield,
  },
];

export function Security() {
  return (
    <section className="w-full max-w-6xl mx-auto px-6 mt-32 md:mt-48 relative z-10 text-left">
      <div className="border-t border-white/[0.08] pt-16 mb-20 max-w-3xl">
        <span className="text-[11px] font-mono tracking-widest text-white/30 uppercase">
          Trust Center
        </span>
        <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight mt-3">
          Security is our architecture. Not an afterthought.
        </h2>
        <p className="mt-4 text-sm md:text-base text-white/50 max-w-xl font-light">
          Derivo operates natively on your machine without compromising privacy. We build layers of
          defense to protect your workflows.
        </p>
      </div>

      {/* Visual Timeline Pipeline */}
      <div className="relative max-w-4xl mx-auto mt-24">
        {/* Vertical Center Track line */}
        <div className="absolute left-4 md:left-1/2 top-4 bottom-4 w-[2px] bg-white/[0.06] -translate-x-1/2 z-0" />

        {/* Timeline Nodes */}
        <div className="space-y-16 md:space-y-24 relative z-10">
          {securitySteps.map((step, idx) => {
            const Icon = step.icon;
            const isLeft = idx % 2 === 0;

            return (
              <div
                key={step.title}
                className={`flex flex-col md:flex-row items-start relative ${
                  isLeft ? 'md:flex-row-reverse' : 'md:flex-row'
                }`}
              >
                {/* Node center indicator dot */}
                <div className="absolute left-4 md:left-1/2 top-4 -translate-x-1/2 w-6 h-6 rounded-full border-4 border-[#080808] bg-white/10 shrink-0 flex items-center justify-center z-20">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                </div>

                {/* Left/Right Text Content Card */}
                <motion.div
                  initial={{ opacity: 0, y: 24, x: isLeft ? 15 : -15 }}
                  whileInView={{ opacity: 1, y: 0, x: 0 }}
                  viewport={{ once: true, margin: '-100px' }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className={`w-full md:w-[45%] pl-12 md:pl-0 ${
                    isLeft ? 'md:text-right md:pr-12' : 'md:text-left md:pl-12'
                  }`}
                >
                  <div className={`flex flex-col ${isLeft ? 'md:items-end' : 'md:items-start'}`}>
                    {/* Icon container */}
                    <div className="w-10 h-10 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-center text-white/50 mb-5">
                      <Icon className="w-4 h-4" />
                    </div>

                    <span className="text-[10px] font-mono tracking-wider text-white/30 uppercase">
                      {step.label}
                    </span>
                    <h3 className="text-lg font-semibold text-white mt-1">{step.title}</h3>
                    <p className="mt-3 text-xs md:text-sm text-white/45 leading-relaxed font-light">
                      {step.desc}
                    </p>
                  </div>
                </motion.div>

                {/* Empty spacer spacer block for desktop symmetry */}
                <div className="hidden md:block w-[45%]" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
