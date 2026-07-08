import { motion } from 'motion/react';
import { Check } from 'lucide-react';

const ease = [0.16, 1, 0.3, 1] as const;

const communityFeatures = [
  'Run derivo doctor diagnostics',
  'Inspect project structure & risks',
  'Validate against best-practice rules',
  'Authenticate your machine',
];

const proFeatures = [
  'Everything in Community',
  'Create & set up unlimited projects',
  'Full derivo setup automation',
  'Shared .env template sync',
  'Standardized database seeds',
];

export function Pricing() {
  return (
    <section id="pricing" className="w-full bg-background py-28 md:py-36 scroll-mt-20">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease }}
          className="max-w-2xl mb-14"
        >
          <span className="text-xs font-medium tracking-wide text-accent uppercase">Pricing</span>
          <h2 className="mt-3 font-display text-4xl md:text-5xl leading-[1.0] tracking-tight text-foreground">
            Simple licensing, built for <span className="italic">growth</span>.
          </h2>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed max-w-xl">
            Create a free account to run diagnostics and inspect projects. Upgrade to Pro to set up
            projects and sync environments across your team.
          </p>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-2">
          {/* Community */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, ease }}
            className="rounded-2xl border border-border bg-background p-8 flex flex-col"
          >
            <h3 className="text-lg font-semibold text-foreground">Community</h3>
            <p className="text-sm text-muted-foreground mt-1">
              For diagnostics and inspection. Project setup not included.
            </p>
            <div className="mt-6 mb-6 flex items-end gap-1">
              <span className="font-display text-5xl text-foreground leading-none">$0</span>
              <span className="text-sm text-muted-foreground mb-1">free account</span>
            </div>
            <ul className="space-y-3 border-t border-border pt-6 text-sm text-muted-foreground flex-1">
              {communityFeatures.map((f) => (
                <li key={f} className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-foreground shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button className="mt-8 w-full rounded-full border border-border bg-background py-2.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors">
              Create free account
            </button>
          </motion.div>

          {/* Pro */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: 0.1, ease }}
            className="relative rounded-2xl border-2 border-accent bg-background p-8 flex flex-col"
          >
            <span className="absolute top-6 right-6 rounded-full bg-accent/12 text-accent px-2.5 py-1 text-[11px] font-medium">
              Popular
            </span>
            <h3 className="text-lg font-semibold text-foreground">Pro</h3>
            <p className="text-sm text-muted-foreground mt-1">
              For teams syncing environments and shipping fast.
            </p>
            <div className="mt-6 mb-6 flex items-end gap-1">
              <span className="font-display text-5xl text-foreground leading-none">$12</span>
              <span className="text-sm text-muted-foreground mb-1">/ seat / mo</span>
            </div>
            <ul className="space-y-3 border-t border-border pt-6 text-sm text-foreground flex-1">
              {proFeatures.map((f) => (
                <li key={f} className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-accent shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button className="mt-8 w-full rounded-full bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
              Start 14-day trial
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
