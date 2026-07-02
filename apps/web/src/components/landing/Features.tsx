import { motion } from 'motion/react';
import { SectionHeading } from './SectionHeading';

const problems = [
  {
    question: 'Wrong Node version?',
    answer: "We'll fix it.",
    details:
      'Automatically match local node environments with your .nvmrc or package.json requirements on shell entry.',
  },
  {
    question: "Redis isn't running?",
    answer: "We'll tell you exactly why.",
    details:
      'Identify missing container binaries, network issues, or configuration conflicts, then launch it in the background.',
  },
  {
    question: 'Port already in use?',
    answer: "We'll find the blocking process.",
    details:
      'Find the stale Node or Docker process occupying port 3000, and free it in a single click.',
  },
  {
    question: 'Missing .env configs?',
    answer: 'Generate it instantly.',
    details:
      'Populate missing local variables using team-approved templates and secure placeholder definitions.',
  },
  {
    question: 'Docker daemon down?',
    answer: "We'll boot it backgrounded.",
    details:
      'Detect inactive engines, safely initialize the service, and handle container status gracefully.',
  },
  {
    question: 'Stale database schema?',
    answer: 'Sync and seed in one run.',
    details:
      'Run safe isolated migrations and seed mock records so your local database perfectly matches main branch schemas.',
  },
];

export function Features() {
  return (
    <section id="features" className="w-full max-w-5xl mx-auto px-6 mt-40 relative z-10">
      <SectionHeading
        eyebrow="Interactive Diagnostics"
        title="We don't just report errors. We fix them."
        subtitle="Derivo constantly monitors your local development space, resolving everyday alignment friction before you can even open your browser."
      />

      <div className="flex flex-col gap-4 text-left max-w-4xl mx-auto">
        {problems.map((prob, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: idx % 2 === 0 ? -48 : 48, filter: 'blur(6px)' }}
            whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            whileHover={{ scale: 1.015 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="group flex flex-col md:flex-row md:items-center gap-4 md:gap-8 px-7 md:px-9 py-6 md:py-7 rounded-[36px] md:rounded-full bg-white/[0.02] border border-white/[0.07] hover:bg-white/[0.045] hover:border-white/[0.14] hover:shadow-[0_0_40px_-12px_rgba(99,102,241,0.25)] transition-all duration-300"
          >
            <span className="w-9 h-9 shrink-0 rounded-full bg-white/[0.04] border border-white/[0.1] text-[11px] font-mono text-white/40 group-hover:text-white/80 group-hover:border-white/[0.2] flex items-center justify-center transition-colors">
              {String(idx + 1).padStart(2, '0')}
            </span>
            <div className="md:w-[38%] shrink-0">
              <h3 className="text-sm text-white/50 leading-snug">{prob.question}</h3>
              <p className="text-base font-semibold text-white mt-0.5">{prob.answer}</p>
            </div>
            <p className="text-sm text-white/40 leading-relaxed font-light group-hover:text-white/60 transition-colors">
              {prob.details}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
