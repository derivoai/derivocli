import { motion } from 'motion/react';
import { TypewriterText } from './TypewriterText';

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
    <section
      id="features"
      className="w-full max-w-5xl mx-auto px-6 mt-40 relative z-10 text-left"
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-2xl mb-20"
      >
        <span className="text-[11px] font-mono tracking-widest text-white/30 uppercase">
          Interactive Diagnostics
        </span>
        <TypewriterText
          text="We don't just report errors. We fix them."
          as="h2"
          className="text-4xl md:text-5xl font-bold text-white tracking-tight mt-3 block leading-[1.1]"
          speed={20}
          delay={300}
        />
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mt-4 text-base text-white/60 leading-relaxed font-light"
        >
          Derivo constantly monitors your local development space, resolving everyday alignment
          friction before you can even open your browser.
        </motion.p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {problems.map((prob, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, delay: idx * 0.07, ease: [0.16, 1, 0.3, 1] }}
            className="group relative p-8 rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:bg-white/[0.04] hover:border-white/[0.14] transition-colors duration-300 flex flex-col justify-between min-h-[220px]"
          >
            <div>
              <div className="flex items-center gap-2.5 mb-5">
                <span className="w-6 h-6 rounded-md bg-white/[0.04] border border-white/[0.08] text-[10px] font-mono text-white/40 flex items-center justify-center">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">
                  Scenario
                </span>
              </div>

              <h3 className="text-base font-medium text-white/80 group-hover:text-white transition-colors leading-snug">
                {prob.question}
              </h3>
              <p className="text-base font-semibold mt-1 text-white">{prob.answer}</p>
            </div>

            <p className="text-sm text-white/45 leading-relaxed mt-6 font-light group-hover:text-white/65 transition-colors duration-300">
              {prob.details}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
