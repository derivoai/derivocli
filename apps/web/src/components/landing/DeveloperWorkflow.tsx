import { useRef } from 'react';
import { motion, useInView, useScroll, useSpring } from 'motion/react';
import { SectionHeading } from './SectionHeading';

const workflowSteps = [
  {
    phase: '01',
    title: 'Clone repository',
    description:
      'Pull down your code as normal. No special templates or configuration wrappers required.',
    cmd: 'git clone git@github.com:org/app.git',
  },
  {
    phase: '02',
    title: 'Run derivo setup',
    description:
      'Launch the local agent. Derivo scans repository manifests and reads structural service parameters.',
    cmd: 'derivo setup',
  },
  {
    phase: '03',
    title: 'Dependencies aligned',
    description:
      'Detects node/bun environments, installs node modules with smart local caching, and validates binaries.',
  },
  {
    phase: '04',
    title: 'Environment validated',
    description:
      'Resolves .env mismatches, spins up containerized databases, and frees conflicting active ports.',
  },
  {
    phase: '05',
    title: 'Database ready',
    description:
      'Automatically synchronizes schemas, runs pending migrations, and inserts local development seed mock sets.',
  },
  {
    phase: '06',
    title: 'Start coding',
    description:
      'Your workspace is pristine, verified, and completely configured. Open your editor and ship.',
    cmd: 'npm run dev',
  },
];

const ease = [0.16, 1, 0.3, 1] as const;

export function DeveloperWorkflow() {
  const trackRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ['start 55%', 'end 60%'],
  });
  const fill = useSpring(scrollYProgress, { stiffness: 90, damping: 28, restDelta: 0.001 });

  return (
    <section
      id="how-it-works"
      className="w-full max-w-5xl mx-auto px-6 mt-40 relative z-10 text-left"
    >
      <SectionHeading
        eyebrow="The Protocol"
        title="From clone to container in seconds."
        subtitle="Say goodbye to stale wiki guides and day-one onboarding debugging marathons."
        className="mb-24"
      />

      <div
        ref={trackRef}
        className="relative pl-8 md:pl-12 ml-4 space-y-16 text-left max-w-3xl mx-auto"
      >
        {/* Static track */}
        <div className="absolute left-0 top-2 bottom-2 w-px bg-white/[0.08]" />
        {/* Scroll-driven light fill */}
        <motion.div
          style={{ scaleY: fill }}
          className="absolute left-0 top-2 bottom-2 w-px bg-gradient-to-b from-indigo-300/80 via-white/70 to-white/70 origin-top shadow-[0_0_12px_rgba(129,140,248,0.5)]"
        />

        {workflowSteps.map((step, idx) => (
          <StepItem key={step.phase} step={step} index={idx} />
        ))}
      </div>
    </section>
  );
}

function StepItem({ step, index }: { step: (typeof workflowSteps)[number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  // Active when the step sits near the vertical center of the viewport.
  const active = useInView(ref, { margin: '-48% 0px -48% 0px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay: index * 0.06, ease }}
      className="relative group"
    >
      {/* Step bullet — lights up as it scrolls into the center */}
      <motion.div
        animate={{
          backgroundColor: active ? '#ffffff' : 'rgba(8,8,8,1)',
          borderColor: active ? '#ffffff' : 'rgba(255,255,255,0.2)',
          color: active ? '#000000' : 'rgba(255,255,255,0.45)',
          scale: active ? 1.12 : 1,
          boxShadow: active
            ? '0 0 20px rgba(255,255,255,0.35), 0 0 44px rgba(129,140,248,0.3)'
            : '0 0 0 rgba(0,0,0,0)',
        }}
        transition={{ duration: 0.35, ease }}
        className="absolute -left-[41px] md:-left-[57px] top-[1.625rem] w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-mono"
      >
        {step.phase}
      </motion.div>

      <motion.div
        animate={{
          backgroundColor: active ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0)',
          borderColor: active ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0)',
        }}
        transition={{ duration: 0.35, ease }}
        className="max-w-3xl p-6 rounded-3xl border"
      >
        <motion.h3
          animate={{ color: active ? '#ffffff' : 'rgba(255,255,255,0.8)' }}
          transition={{ duration: 0.35, ease }}
          className="text-xl font-semibold tracking-tight"
        >
          {step.title}
        </motion.h3>
        <p className="mt-2 text-sm text-white/50 leading-relaxed max-w-xl font-light">
          {step.description}
        </p>

        {step.cmd && (
          <div className="mt-4 inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/[0.02] border border-white/[0.08] font-mono text-xs text-white/70">
            <span className="text-white/30">$</span>
            <span>{step.cmd}</span>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
