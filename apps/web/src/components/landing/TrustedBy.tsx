import { motion } from 'motion/react';
import { TypewriterText } from './TypewriterText';

const technologies = [
  { name: 'Node.js', type: 'Runtime' },
  { name: 'Docker', type: 'Containers' },
  { name: 'PostgreSQL', type: 'Database' },
  { name: 'Redis', type: 'Cache' },
  { name: 'Next.js', type: 'Framework' },
  { name: 'NestJS', type: 'Backend' },
  { name: 'Express', type: 'Server' },
  { name: 'React', type: 'Frontend' },
  { name: 'pnpm', type: 'Package Manager' },
  { name: 'Bun', type: 'Runtime' },
];

const marqueeItems = [...technologies, ...technologies];

export function TrustedBy() {
  return (
    <section className="w-full max-w-5xl mx-auto px-6 mt-32 md:mt-44 relative z-10 text-left">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-10 border-t border-white/[0.08] pt-16">
        {/* Left text column */}
        <div className="md:w-1/3">
          <span className="text-[11px] font-mono tracking-widest text-white/30 uppercase">
            Ecosystem
          </span>
          <TypewriterText
            text="Works with your favorite tech stack."
            as="h2"
            className="text-3xl font-bold text-white tracking-tight mt-3 block leading-tight"
            speed={22}
            delay={200}
          />
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="mt-4 text-sm text-white/60 leading-relaxed font-light"
          >
            Derivo reads your existing stack configuration files, automatically provisions local
            dependencies, and ensures your environment stays aligned with production. No code
            changes required.
          </motion.p>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 flex gap-6"
          >
            {[
              ['10+', 'Runtimes'],
              ['Zero', 'Config changes'],
              ['1 cmd', 'To boot all'],
            ].map(([val, label]) => (
              <div key={label} className="flex flex-col gap-1">
                <span className="text-xl font-bold text-white">{val}</span>
                <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider">
                  {label}
                </span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right card grid */}
        <div className="md:w-2/3 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {technologies.map((tech, idx) => (
            <motion.div
              key={tech.name}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="group relative flex flex-col justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] hover:bg-white/[0.04] hover:border-white/[0.14] transition-colors duration-300 cursor-default min-h-[84px]"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-white/40 group-hover:bg-white/70 transition-colors" />
                <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest">
                  {tech.type}
                </span>
              </div>

              <span className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors leading-snug">
                {tech.name}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Marquee strip */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1, delay: 0.3 }}
        className="mt-14 relative overflow-hidden"
        style={{
          maskImage:
            'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
          WebkitMaskImage:
            'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
        }}
      >
        <div className="flex gap-4 w-max" style={{ animation: 'marquee 30s linear infinite' }}>
          {marqueeItems.map((tech, idx) => (
            <div
              key={`${tech.name}-${idx}`}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.02] border border-white/[0.08] whitespace-nowrap"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
              <span className="text-xs text-white/50 font-medium">{tech.name}</span>
            </div>
          ))}
        </div>
        <style>{`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          @media (prefers-reduced-motion: reduce) {
            .flex.gap-4.w-max { animation: none; }
          }
        `}</style>
      </motion.div>
    </section>
  );
}
