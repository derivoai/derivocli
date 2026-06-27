import { motion } from 'motion/react';
import { TypewriterText } from './TypewriterText';

const technologies = [
  { name: 'Node.js', type: 'Runtime', icon: '⬡', color: 'from-green-500/10 to-transparent', border: 'hover:border-green-500/20', dot: 'bg-green-400' },
  { name: 'Docker', type: 'Containers', icon: '⬡', color: 'from-blue-500/10 to-transparent', border: 'hover:border-blue-500/20', dot: 'bg-blue-400' },
  { name: 'PostgreSQL', type: 'Database', icon: '⬡', color: 'from-sky-500/10 to-transparent', border: 'hover:border-sky-500/20', dot: 'bg-sky-400' },
  { name: 'Redis', type: 'Cache', icon: '⬡', color: 'from-rose-500/10 to-transparent', border: 'hover:border-rose-500/20', dot: 'bg-rose-400' },
  { name: 'Next.js', type: 'Framework', icon: '⬡', color: 'from-white/10 to-transparent', border: 'hover:border-white/20', dot: 'bg-white' },
  { name: 'NestJS', type: 'Backend', icon: '⬡', color: 'from-red-500/10 to-transparent', border: 'hover:border-red-500/20', dot: 'bg-red-400' },
  { name: 'Express', type: 'Server', icon: '⬡', color: 'from-white/8 to-transparent', border: 'hover:border-white/15', dot: 'bg-white/60' },
  { name: 'React', type: 'Frontend', icon: '⬡', color: 'from-cyan-500/10 to-transparent', border: 'hover:border-cyan-500/20', dot: 'bg-cyan-400' },
  { name: 'pnpm', type: 'Package Manager', icon: '⬡', color: 'from-amber-500/10 to-transparent', border: 'hover:border-amber-500/20', dot: 'bg-amber-400' },
  { name: 'Bun', type: 'Runtime', icon: '⬡', color: 'from-pink-500/10 to-transparent', border: 'hover:border-pink-500/20', dot: 'bg-pink-400' },
];

const marqueeItems = [...technologies, ...technologies];

export function TrustedBy() {
  return (
    <section className="w-full max-w-5xl mx-auto px-6 mt-32 md:mt-44 relative z-10 text-left">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-10 border-t border-white/[0.06] pt-16">
        
        {/* Left text column */}
        <div className="md:w-1/3">
          <span className="text-[11px] font-mono tracking-widest text-white/30 uppercase">Ecosystem</span>
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
            className="mt-4 text-sm text-white/50 leading-relaxed font-light"
          >
            Derivo reads your existing stack configuration files, automatically provisions local dependencies, and ensures your environment stays aligned with production. No code changes required.
          </motion.p>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 flex gap-6"
          >
            {[['10+', 'Runtimes'], ['Zero', 'Config changes'], ['1 cmd', 'To boot all']].map(([val, label]) => (
              <div key={label} className="flex flex-col gap-1">
                <span className="text-xl font-bold text-white">{val}</span>
                <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider">{label}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right card grid */}
        <div className="md:w-2/3 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {technologies.map((tech, idx) => (
            <motion.div
              key={tech.name}
              initial={{ opacity: 0, y: 24, scale: 0.92, rotateX: 14 }}
              whileInView={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
              whileHover={{ y: -6, scale: 1.05, rotateX: -6, rotateY: 6 }}
              viewport={{ once: true, margin: '-40px' }}
              style={{ transformPerspective: 800 }}
              transition={{ duration: 0.65, delay: idx * 0.055, ease: [0.16, 1, 0.3, 1] }}
              className={`group relative flex flex-col justify-between p-4 rounded-xl bg-gradient-to-b ${tech.color} backdrop-blur-sm border border-white/[0.06] ${tech.border} hover:shadow-[0_12px_28px_-10px_rgba(255,255,255,0.06),inset_0_1px_0_rgba(255,255,255,0.08)] transition-all duration-350 overflow-hidden cursor-default`}
            >
              {/* Hover shimmer */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none" />

              {/* Status dot */}
              <div className="relative z-10 flex items-center gap-2 mb-3">
                <span className={`w-1.5 h-1.5 rounded-full ${tech.dot} opacity-60 group-hover:opacity-100 transition-opacity`} />
                <span className="text-[9px] font-mono text-white/25 uppercase tracking-widest">{tech.type}</span>
              </div>

              <span className="relative z-10 text-sm font-semibold text-white/80 group-hover:text-white transition-colors leading-snug">
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
      >
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#050505] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#050505] to-transparent z-10 pointer-events-none" />
        <div
          className="flex gap-4 w-max"
          style={{ animation: 'marquee 30s linear infinite' }}
        >
          {marqueeItems.map((tech, idx) => (
            <div
              key={`${tech.name}-${idx}`}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.02] border border-white/[0.05] whitespace-nowrap"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${tech.dot} opacity-60`} />
              <span className="text-xs text-white/40 font-medium">{tech.name}</span>
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
