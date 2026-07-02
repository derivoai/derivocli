import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Minus } from 'lucide-react';
import { cn } from '../../lib/utils';

const faqs = [
  {
    question: 'Do I need an account to use the CLI?',
    answer:
      'Yes. Derivo requires an account, and you authenticate each machine by running "derivo login". Creating and setting up projects requires a Pro plan or an active trial — start a trial to set up your first project.',
  },
  {
    question: 'Does this replace Docker Compose?',
    answer:
      'No. Derivo orchestrates and verifies your existing local tools. If you use Docker Compose, Derivo confirms Docker is running, resolves active port conflicts first, and then executes your compose commands safely.',
  },
  {
    question: 'What environments and frameworks are supported?',
    answer:
      'Derivo detects Node.js and Bun runtimes; npm, pnpm, and yarn; Docker; PostgreSQL and Redis; and frameworks including Next.js, React, Express, NestJS, Prisma, Tailwind, and TypeScript out of the box. Additional behavior can be declared through plugins and your local derivo.json.',
  },
  {
    question: 'Is my repository source code sent to your servers?',
    answer:
      'No. Your source code never leaves your machine. Derivo only reads structural manifests (like package.json or docker-compose.yml) to understand your environment. When you are signed in, account, device, and project metadata sync to your dashboard — never your code.',
  },
  {
    question: 'How is my session secured?',
    answer:
      'CLI sessions are encrypted at rest with AES-256-GCM and bound to your machine, so a copied credentials file will not work elsewhere. You can review active sessions, trust or remove devices, and revoke API keys at any time from your dashboard.',
  },
  {
    question: 'How do I install Derivo?',
    answer:
      'Install it globally from npm by running "npm install -g derivo", then run "derivo login" to authenticate. To set up a project, start a Pro trial or upgrade, then run "derivo setup" inside any repository. Node.js 18 or newer is required.',
  },
];

export function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const handleKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpenIdx(openIdx === idx ? null : idx);
    }
  };

  return (
    <section className="w-full max-w-6xl mx-auto px-6 mt-32 md:mt-48 relative z-10 text-left">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-16">
        {/* Left Side Header */}
        <div className="lg:w-1/3 shrink-0">
          <span className="text-[11px] font-mono tracking-widest text-white/30 uppercase">
            Support
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mt-3">
            Common questions
          </h2>
          <p className="mt-4 text-sm text-white/50 leading-relaxed font-light">
            Answers to common questions about Derivo's local architecture and synchronization
            capabilities.
          </p>
        </div>

        {/* Right Side Accordion List */}
        <div className="lg:w-2/3 w-full border-t border-white/10">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div key={idx} className="border-b border-white/10">
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                  className="w-full py-7 flex items-center justify-between text-left transition-colors focus:outline-none group cursor-pointer"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${idx}`}
                  id={`faq-btn-${idx}`}
                >
                  <span
                    className={cn(
                      'font-semibold text-sm transition-colors duration-300',
                      isOpen ? 'text-white' : 'text-white/70 group-hover:text-white',
                    )}
                  >
                    {faq.question}
                  </span>

                  {/* Minimal toggle marker */}
                  <span className="text-white/40 group-hover:text-white/80 transition-colors ml-4 shrink-0">
                    {isOpen ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`faq-answer-${idx}`}
                      role="region"
                      aria-labelledby={`faq-btn-${idx}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="pb-8 text-[13px] text-white/50 leading-relaxed font-light max-w-2xl">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
