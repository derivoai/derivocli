import { motion } from 'motion/react';

import { Link } from 'react-router-dom';

export function PricingPreview() {
  return (
    <section id="pricing" className="w-full max-w-5xl mx-auto px-6 mt-40 relative z-10 text-left">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-12 border-t border-white/[0.06] pt-16 mb-16">
        <div className="md:w-1/3">
          <span className="text-[11px] font-mono tracking-widest text-white/30 uppercase">Pricing</span>
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mt-3">Simple licensing. Built for growth.</h2>
          <p className="mt-4 text-sm text-white/50 leading-relaxed font-light">
            Start completely free for individual development work. Sync with your team when scaling production workloads.
          </p>
        </div>

        <div className="md:w-2/3 grid sm:grid-cols-2 gap-6 w-full">
          {/* Plan 1 */}
          <motion.div 
            initial={{ opacity: 0, y: 30, scale: 0.95, rotateY: -10 }}
            whileInView={{ opacity: 1, y: 0, scale: 1, rotateY: 0 }}
            whileHover={{ y: -5, scale: 1.02, rotateX: -2, rotateY: 5 }}
            viewport={{ once: true, margin: "-50px" }}
            style={{ transformPerspective: 1000 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="p-8 rounded-2xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] backdrop-blur-md border border-white/[0.05] hover:bg-white/[0.04] hover:border-white/[0.1] hover:shadow-[0_20px_40px_-15px_rgba(255,255,255,0.05),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all duration-500 flex flex-col justify-between relative group overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className="relative z-10">
              <h3 className="text-lg font-semibold text-white/90">Community</h3>
              <p className="text-xs text-white/40 mt-1 font-light">For local personal projects and offline diagnostics.</p>
              <div className="text-3xl font-bold text-white mt-6 mb-6">
                $0
                <span className="text-xs text-white/30 font-normal ml-1">forever</span>
              </div>
              <ul className="space-y-3 border-t border-white/[0.04] pt-6 text-white/50 text-xs">
                <li className="flex gap-2.5 items-center">
                  <span className="w-1 h-1 rounded-full bg-white/40" />
                  Local config file parser
                </li>
                <li className="flex gap-2.5 items-center">
                  <span className="w-1 h-1 rounded-full bg-white/40" />
                  Infinite local executions
                </li>
                <li className="flex gap-2.5 items-center">
                  <span className="w-1 h-1 rounded-full bg-white/40" />
                  Port and dependency checks
                </li>
              </ul>
            </div>
            <Link to="/register" className="relative z-10 w-full py-2.5 rounded-lg bg-white/[0.03] text-white/80 border border-white/[0.06] text-xs font-medium hover:bg-white/[0.08] transition-all mt-8 block text-center focus-visible:ring-2 focus-visible:ring-white">
              Download CLI
            </Link>
          </motion.div>

          {/* Plan 2 */}
          <motion.div 
            initial={{ opacity: 0, y: 30, scale: 0.95, rotateY: 10 }}
            whileInView={{ opacity: 1, y: 0, scale: 1, rotateY: 0 }}
            whileHover={{ y: -5, scale: 1.02, rotateX: -2, rotateY: -5 }}
            viewport={{ once: true, margin: "-50px" }}
            style={{ transformPerspective: 1000 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="p-8 rounded-2xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] backdrop-blur-xl border border-white/[0.08] hover:border-white/[0.15] hover:shadow-[0_20px_50px_-15px_rgba(255,255,255,0.08),inset_0_1px_0_rgba(255,255,255,0.2)] transition-all duration-500 flex flex-col justify-between relative group overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-tl from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className="relative z-10">
              <h3 className="text-lg font-semibold text-white">Team</h3>
              <p className="text-xs text-white/40 mt-1 font-light">For organizations syncing alignment rules and environments.</p>
              <div className="text-3xl font-bold text-white mt-6 mb-6">
                $12
                <span className="text-xs text-white/30 font-normal ml-1">/ seat / mo</span>
              </div>
              <ul className="space-y-3 border-t border-white/[0.04] pt-6 text-white/60 text-xs">
                <li className="flex gap-2.5 items-center">
                  <span className="w-1 h-1 rounded-full bg-blue-400" />
                  Shared .env template sync
                </li>
                <li className="flex gap-2.5 items-center">
                  <span className="w-1 h-1 rounded-full bg-blue-400" />
                  Team project synchronization
                </li>
                <li className="flex gap-2.5 items-center">
                  <span className="w-1 h-1 rounded-full bg-blue-400" />
                  Standardized database seeds
                </li>
                <li className="flex gap-2.5 items-center">
                  <span className="w-1 h-1 rounded-full bg-blue-400" />
                  Priority remote validation support
                </li>
              </ul>
            </div>
            <Link to="/register" className="relative z-10 w-full py-2.5 rounded-lg bg-white text-black text-xs font-semibold hover:bg-white/90 transition-all mt-8 shadow-[0_4px_12px_rgba(255,255,255,0.1)] block text-center focus-visible:ring-2 focus-visible:ring-white">
              Start 14-day Trial
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
