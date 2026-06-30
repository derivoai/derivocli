import { motion } from 'motion/react';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
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
    <section className="w-full max-w-5xl mx-auto px-6 mt-40 relative z-10 text-left">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-12 border-t border-white/[0.08] pt-16">
        <div className="md:w-1/3">
          <span className="text-[11px] font-mono tracking-widest text-white/30 uppercase">Support</span>
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mt-3">FAQ</h2>
          <p className="mt-4 text-sm text-white/60 leading-relaxed font-light">
            Answers to common questions about Derivo's architecture and local verification capabilities.
          </p>
        </div>

        <div className="md:w-2/3 space-y-3 w-full">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
                className="border border-white/[0.08] rounded-xl bg-white/[0.02] overflow-hidden hover:border-white/[0.14] transition-colors duration-300"
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-white rounded-xl"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${idx}`}
                  id={`faq-btn-${idx}`}
                >
                  <span className="font-semibold text-white/90 text-sm">{faq.question}</span>
                  <ChevronDown className={cn("w-4 h-4 text-white/40 transition-transform duration-300 shrink-0 ml-4", isOpen && "rotate-180")} />
                </button>
                <motion.div 
                  initial={false}
                  animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                  id={`faq-answer-${idx}`}
                  role="region"
                  aria-labelledby={`faq-btn-${idx}`}
                >
                  <div className="px-6 pb-6 text-xs text-white/55 leading-relaxed font-light">
                    {faq.answer}
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
