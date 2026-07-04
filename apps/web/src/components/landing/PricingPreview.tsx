import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';

const planFeatures = [
  '14-day free trial included',
  'Unlimited synced projects',
  'Real-time workspace dashboard',
  'Device & trust management',
  'Encrypted session controls',
  'CLI setup & run automation',
  'AST code parsing & inspection',
  'Continuous environment validation',
  'First-party plugin support',
  '24/7 Priority developer support',
];

export function PricingPreview() {
  return (
    <section
      id="pricing"
      className="w-full max-w-6xl mx-auto px-6 mt-32 md:mt-48 relative z-10 text-center"
    >
      <div className="mb-16">
        <span className="text-[11px] font-mono tracking-widest text-white/30 uppercase">
          Pricing
        </span>
        <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight mt-3">
          Simple pricing. Done right.
        </h2>
        <p className="mt-4 text-sm md:text-base text-white/50 max-w-lg mx-auto font-light leading-relaxed">
          One plan. All capabilities included. Start for free and scale with your engineering team.
        </p>
      </div>

      {/* Luxurious Centered Pricing Card */}
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-2xl mx-auto relative rounded-[2rem] bg-white/[0.015] border border-white/10 hover:border-white/25 backdrop-blur-xl transition-all duration-500 p-8 md:p-16 text-left shadow-[0_0_80px_rgba(59,130,246,0.12),0_40px_80px_-30px_rgba(0,0,0,0.95)] group"
      >
        {/* Soft background glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent rounded-[2rem] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <span className="px-3.5 py-1 text-[10px] font-mono uppercase tracking-widest text-white/40 border border-white/10 rounded-full bg-white/[0.02]">
            Derivo+
          </span>

          <div className="flex items-baseline mt-8">
            <span className="text-6xl md:text-7xl font-bold text-white tracking-tighter">$19</span>
            <span className="text-white/40 text-sm ml-2 font-mono uppercase tracking-wider">
              / seat / mo
            </span>
          </div>
          <span className="text-xs text-white/30 font-light mt-2">
            Billed monthly, cancel anytime
          </span>

          {/* CTA Buttons */}
          <div className="w-full max-w-sm flex flex-col gap-3 mt-10 mb-12">
            <Link
              to="/register"
              className="w-full py-4 rounded-full bg-white text-black font-semibold text-sm hover:bg-neutral-100 transition-colors block text-center shadow-lg hover:scale-[1.01] active:scale-[0.99]"
            >
              Start Free Trial
            </Link>

            <a
              href="https://docs.derivo.dev"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-white/40 hover:text-white transition-colors py-2 text-center"
            >
              Read Documentation
            </a>
          </div>
        </div>

        {/* Feature Grid inside Card */}
        <div className="border-t border-white/5 pt-10">
          <h4 className="text-xs font-mono uppercase tracking-wider text-white/30 mb-6 text-center">
            Everything you need for development
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
            {planFeatures.map((feat) => (
              <div key={feat} className="flex gap-3 items-center">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-[13px] text-white/60 font-light leading-snug">{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
