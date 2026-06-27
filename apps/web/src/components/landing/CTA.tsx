import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

import { Link } from 'react-router-dom';

export function CTA() {
  return (
    <section className="w-full max-w-5xl mx-auto px-6 mt-40 mb-20 relative z-10">
      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95, rotateX: 10 }}
        whileInView={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
        whileHover={{ scale: 1.01, rotateX: -1, rotateY: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        style={{ transformPerspective: 1000 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-3xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-2xl border border-white/[0.08] p-12 md:p-16 overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-10 shadow-[0_30px_60px_-15px_rgba(255,255,255,0.05),inset_0_1px_0_rgba(255,255,255,0.1)] group"
      >
        <div className="absolute inset-0 bg-gradient-to-tl from-white/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
        
        <div className="relative z-10 max-w-xl">
          <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight leading-[1.1]">
            Code. <br className="sm:hidden" />
            Not configuration.
          </h2>
          <p className="text-sm text-white/50 mt-4 leading-relaxed font-light">
            Eliminate onboarding bottlenecks and environment alignment friction permanently. Install the local-first CLI and start shipping instantly.
          </p>
        </div>
        
        <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <Link to="/register" className="h-11 px-6 rounded-lg bg-white text-black text-xs font-semibold hover:bg-white/90 transition-all flex items-center justify-center gap-2 group shadow-[0_4px_12px_rgba(255,255,255,0.1)] focus-visible:ring-2 focus-visible:ring-white">
            Install derivo CLI
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link to="/docs" className="h-11 px-6 rounded-lg bg-white/[0.02] text-white/80 border border-white/[0.06] text-xs font-medium hover:bg-white/[0.06] transition-all flex items-center justify-center focus-visible:ring-2 focus-visible:ring-white">
            Read Integration Guide
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
