import { LogIn, Wrench, Stethoscope, ScanSearch, ShieldCheck, Blocks } from 'lucide-react';
import { motion } from 'motion/react';
import { SectionHeading } from './SectionHeading';

const commands = [
  {
    cmd: 'derivo login',
    icon: LogIn,
    desc: 'Authenticate this machine with your Derivo account in a single browser step.',
  },
  {
    cmd: 'derivo setup',
    icon: Wrench,
    desc: 'Detect your stack, fix runtime and service issues, and prepare the project to run.',
  },
  {
    cmd: 'derivo doctor',
    icon: Stethoscope,
    desc: 'Run full diagnostics on your machine and project. Add --fix to auto-repair.',
  },
  {
    cmd: 'derivo inspect',
    icon: ScanSearch,
    desc: 'Analyze project structure, surface risks, and get actionable recommendations.',
  },
  {
    cmd: 'derivo validate',
    icon: ShieldCheck,
    desc: 'Check the project against best-practice rules and apply safe, confirmed fixes.',
  },
  {
    cmd: 'derivo plugin',
    icon: Blocks,
    desc: 'Extend Derivo with framework-aware plugins for your team’s exact workflow.',
  },
];

export function Commands() {
  return (
    <section className="w-full max-w-5xl mx-auto px-6 mt-40 relative z-10">
      <SectionHeading
        eyebrow="Command Reference"
        title="One CLI for the whole environment."
        subtitle="Every command is local-first and scriptable. Learn one tool instead of a dozen setup docs."
      />

      <div className="grid sm:grid-cols-2 gap-4 text-left max-w-4xl mx-auto">
        {commands.map((c, idx) => {
          const Icon = c.icon;
          return (
            <motion.div
              key={c.cmd}
              initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }}
              whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              whileHover={{ scale: 1.02, y: -3 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: idx * 0.06, ease: [0.16, 1, 0.3, 1] }}
              className="group flex items-start gap-4 px-6 py-5 rounded-[32px] bg-white/[0.02] border border-white/[0.07] hover:bg-white/[0.045] hover:border-white/[0.14] hover:shadow-[0_0_40px_-12px_rgba(99,102,241,0.25)] transition-all duration-300"
            >
              <span className="w-10 h-10 shrink-0 rounded-full bg-white/[0.04] border border-white/[0.1] flex items-center justify-center text-white/60 group-hover:text-white group-hover:border-white/[0.2] transition-colors">
                <Icon className="w-4 h-4" />
              </span>
              <div>
                <code className="font-mono text-sm text-white/85">{c.cmd}</code>
                <p className="mt-1 text-sm text-white/40 leading-relaxed font-light group-hover:text-white/60 transition-colors">
                  {c.desc}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
