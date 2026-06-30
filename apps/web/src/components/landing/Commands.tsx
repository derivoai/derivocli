import { motion } from 'motion/react';
import { LogIn, Wrench, Stethoscope, ScanSearch, ShieldCheck, Blocks } from 'lucide-react';

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
    <section className="w-full max-w-5xl mx-auto px-6 mt-40 relative z-10 text-left">
      <div className="border-t border-white/[0.08] pt-16 mb-12 max-w-2xl">
        <span className="text-[11px] font-mono tracking-widest text-white/30 uppercase">
          Command Reference
        </span>
        <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mt-3 leading-[1.1]">
          One CLI for the whole environment.
        </h2>
        <p className="mt-4 text-sm text-white/60 leading-relaxed font-light">
          Every command is local-first and scriptable. Learn one tool instead of a dozen setup
          docs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {commands.map((c, idx) => {
          const Icon = c.icon;
          return (
            <motion.div
              key={c.cmd}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: idx * 0.06, ease: [0.16, 1, 0.3, 1] }}
              className="group p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:bg-white/[0.04] hover:border-white/[0.14] transition-colors duration-300"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white/60 group-hover:text-white transition-colors">
                  <Icon className="w-4 h-4" />
                </span>
                <code className="font-mono text-sm text-white/85">{c.cmd}</code>
              </div>
              <p className="text-sm text-white/45 leading-relaxed font-light group-hover:text-white/65 transition-colors">
                {c.desc}
              </p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
