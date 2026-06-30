import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CommandLine } from '../CommandLine';

export function CTA() {
  return (
    <section className="w-full max-w-5xl mx-auto px-6 mt-40 mb-20 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-3xl bg-white/[0.03] border border-white/[0.1] px-6 py-16 md:py-20 overflow-hidden"
      >
        {/* Subtle grid texture, faded toward the edges */}
        <div
          className="absolute inset-0 opacity-[0.5] pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)
            `,
            backgroundSize: '44px 44px',
            maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          }}
        />

        <div className="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto">
          <span className="text-[11px] font-mono tracking-widest text-white/30 uppercase mb-5">
            Get started
          </span>
          <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight leading-[1.05]">
            Code. Not configuration.
          </h2>
          <p className="text-base text-white/55 mt-5 leading-relaxed font-light max-w-lg">
            Eliminate onboarding bottlenecks and environment friction for good. Install the
            local-first CLI and have any repository running in seconds.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row items-center gap-3">
            <Link
              to="/register"
              className="h-12 px-7 rounded-full bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors flex items-center justify-center gap-2 group"
            >
              Get started free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              to="/docs"
              className="h-12 px-7 rounded-full bg-transparent text-white/80 border border-white/[0.12] text-sm font-medium hover:bg-white/[0.05] hover:text-white hover:border-white/20 transition-colors flex items-center justify-center"
            >
              Read the docs
            </Link>
          </div>

          <div className="mt-8 w-full max-w-xs">
            <CommandLine command="npm install -g derivo" />
          </div>
        </div>
      </motion.div>
    </section>
  );
}
