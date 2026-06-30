import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export function PricingPreview() {
  return (
    <section
      id="pricing"
      className="w-full max-w-5xl mx-auto px-6 mt-40 relative z-10 text-left"
    >
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-12 border-t border-white/[0.08] pt-16 mb-16">
        <div className="md:w-1/3">
          <span className="text-[11px] font-mono tracking-widest text-white/30 uppercase">
            Pricing
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mt-3">
            Simple licensing. Built for growth.
          </h2>
          <p className="mt-4 text-sm text-white/60 leading-relaxed font-light">
            Create a free account to run diagnostics and inspect projects. Upgrade to Pro to set up
            projects and sync environments across your team.
          </p>
        </div>

        <div className="md:w-2/3 grid sm:grid-cols-2 gap-5 w-full">
          {/* Community */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="p-8 rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-white/[0.14] transition-colors duration-300 flex flex-col justify-between"
          >
            <div>
              <h3 className="text-lg font-semibold text-white">Community</h3>
              <p className="text-xs text-white/40 mt-1 font-light">
                Free account for diagnostics and inspection. Project setup not included.
              </p>
              <div className="text-3xl font-bold text-white mt-6 mb-6">
                $0
                <span className="text-xs text-white/30 font-normal ml-1">free account</span>
              </div>
              <ul className="space-y-3 border-t border-white/[0.08] pt-6 text-white/55 text-xs">
                {[
                  'Run derivo doctor diagnostics',
                  'Inspect project structure & risks',
                  'Authenticate your machine',
                ].map((item) => (
                  <li key={item} className="flex gap-2.5 items-center">
                    <span className="w-1 h-1 rounded-full bg-white/40" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <Link
              to="/register"
              className="w-full py-2.5 rounded-lg bg-transparent text-white/80 border border-white/[0.12] text-xs font-medium hover:bg-white/[0.05] hover:text-white transition-colors mt-8 block text-center"
            >
              Create free account
            </Link>
          </motion.div>

          {/* Team */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="relative p-8 rounded-2xl bg-white/[0.05] border border-white/[0.16] hover:border-white/[0.24] transition-colors duration-300 flex flex-col justify-between"
          >
            <span className="absolute top-5 right-5 text-[10px] font-mono uppercase tracking-widest text-white/50 border border-white/[0.14] rounded-full px-2.5 py-1">
              Popular
            </span>
            <div>
              <h3 className="text-lg font-semibold text-white">Team</h3>
              <p className="text-xs text-white/40 mt-1 font-light">
                Everything in Community, plus full project setup and team sync.
              </p>
              <div className="text-3xl font-bold text-white mt-6 mb-6">
                $12
                <span className="text-xs text-white/30 font-normal ml-1">/ seat / mo</span>
              </div>
              <ul className="space-y-3 border-t border-white/[0.08] pt-6 text-white/65 text-xs">
                {[
                  'Create & set up unlimited projects',
                  'Full derivo setup automation',
                  'Shared .env template sync',
                  'Standardized database seeds',
                ].map((item) => (
                  <li key={item} className="flex gap-2.5 items-center">
                    <span className="w-1 h-1 rounded-full bg-white/70" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <Link
              to="/register"
              className="w-full py-2.5 rounded-lg bg-white text-black text-xs font-semibold hover:bg-white/90 transition-colors mt-8 block text-center"
            >
              Start 14-day Trial
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
