import { motion } from 'motion/react';
import { TypewriterText } from './TypewriterText';

const workflowSteps = [
  {
    phase: "01",
    title: "Clone repository",
    description: "Pull down your code as normal. No special templates or configuration wrappers required.",
    cmd: "git clone git@github.com:org/app.git"
  },
  {
    phase: "02",
    title: "Run derivo setup",
    description: "Launch the local agent. Derivo scans repository manifests and reads structural service parameters.",
    cmd: "derivo setup",
    active: true
  },
  {
    phase: "03",
    title: "Dependencies aligned",
    description: "Detects node/bun environments, installs node modules with smart local caching, and validates binaries."
  },
  {
    phase: "04",
    title: "Environment validated",
    description: "Resolves .env mismatches, spins up containerized databases, and frees conflicting active ports."
  },
  {
    phase: "05",
    title: "Database ready",
    description: "Automatically synchronizes schemas, runs pending migrations, and inserts local development seed mock sets."
  },
  {
    phase: "06",
    title: "Start coding",
    description: "Your workspace is pristine, verified, and completely configured. Open your editor and ship.",
    cmd: "npm run dev"
  }
];

export function DeveloperWorkflow() {
  return (
    <section id="how-it-works" className="w-full max-w-5xl mx-auto px-6 mt-40 relative z-10 text-left">
      <div className="max-w-2xl mb-24">
        <span className="text-[11px] font-mono tracking-widest text-white/30 uppercase">The Protocol</span>
        <TypewriterText
          text="From clone to container in seconds."
          as="h2"
          className="text-4xl md:text-5xl font-bold text-white tracking-tight mt-3 block leading-[1.1]"
          speed={22}
          delay={200}
        />
        <p className="mt-4 text-base text-white/50 leading-relaxed font-light">
          Say goodbye to stale wiki guides and day-one onboarding debugging marathons.
        </p>
      </div>

      <div className="relative border-l border-white/[0.06] pl-8 md:pl-12 ml-4 space-y-16">
        {workflowSteps.map((step, idx) => (
          <motion.div
            key={step.phase}
            initial={{ opacity: 0, x: -30, rotateY: 15 }}
            whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            style={{ transformPerspective: 1000 }}
            transition={{ duration: 0.8, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="relative group"
          >
            {/* Step bullet */}
            <div className={`absolute -left-[41px] md:-left-[57px] top-[1.625rem] w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-mono transition-all duration-500 group-hover:scale-110 ${
              step.active
                ? "bg-white border-white text-black shadow-[0_0_20px_rgba(255,255,255,0.6)]"
                : "bg-[#050505] border-white/20 text-white/40 group-hover:bg-white/[0.05] group-hover:border-white/40 group-hover:text-white"
            }`}>
              {step.phase}
            </div>

            <div className="max-w-3xl p-6 rounded-2xl border border-transparent group-hover:border-white/[0.05] group-hover:bg-white/[0.02] transition-all duration-500">
              <h3 className={`text-xl font-semibold tracking-tight transition-colors duration-300 ${step.active ? "text-white" : "text-white/80 group-hover:text-white"}`}>
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-white/50 leading-relaxed max-w-xl font-light">
                {step.description}
              </p>
              
              {step.cmd && (
                <div className="mt-4 inline-flex items-center gap-3 px-4 py-2 rounded-lg bg-white/[0.02] border border-white/[0.05] font-mono text-xs text-white/70">
                  <span className="text-white/30">$</span>
                  <span>{step.cmd}</span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
