import { motion } from 'motion/react';
import { SectionHeading } from './SectionHeading';

const technologies = [
  { name: 'Node.js', type: 'Runtime', slug: 'nodedotjs' },
  { name: 'Docker', type: 'Containers', slug: 'docker' },
  { name: 'PostgreSQL', type: 'Database', slug: 'postgresql' },
  { name: 'Redis', type: 'Cache', slug: 'redis' },
  { name: 'Next.js', type: 'Framework', slug: 'nextdotjs' },
  { name: 'NestJS', type: 'Backend', slug: 'nestjs' },
  { name: 'Express', type: 'Server', slug: 'express' },
  { name: 'React', type: 'Frontend', slug: 'react' },
  { name: 'pnpm', type: 'Package Manager', slug: 'pnpm' },
  { name: 'Bun', type: 'Runtime', slug: 'bun' },
];

const marqueeItems = [...technologies, ...technologies];

export function TrustedBy() {
  return (
    <section className="w-full max-w-5xl mx-auto px-6 mt-32 md:mt-44 relative z-10">
      <SectionHeading
        eyebrow="Ecosystem"
        title="Works with your stack."
        subtitle="Derivo reads your existing configuration files and provisions everything locally. No code changes required."
        className="mb-10"
      />

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="flex justify-center gap-12 md:gap-16 mb-12"
      >
        {[
          ['10+', 'Runtimes'],
          ['Zero', 'Config changes'],
          ['1 cmd', 'To boot all'],
        ].map(([val, label]) => (
          <div key={label} className="flex flex-col items-center gap-1">
            <span className="text-2xl font-semibold tracking-tight bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">
              {val}
            </span>
            <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider">
              {label}
            </span>
          </div>
        ))}
      </motion.div>

      {/* Marquee strip */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1, delay: 0.3 }}
        className="relative overflow-hidden"
        style={{
          maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
          WebkitMaskImage:
            'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
        }}
      >
        <div className="flex gap-4 w-max" style={{ animation: 'marquee 30s linear infinite' }}>
          {marqueeItems.map((tech, idx) => (
            <div
              key={`${tech.name}-${idx}`}
              className="flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/[0.03] border border-white/[0.08] whitespace-nowrap backdrop-blur-sm hover:border-white/[0.16] transition-colors"
            >
              <img
                src={`https://cdn.simpleicons.org/${tech.slug}/ffffff`}
                alt=""
                loading="lazy"
                className="w-4 h-4 opacity-70"
              />
              <span className="text-xs text-white/60 font-medium">{tech.name}</span>
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
