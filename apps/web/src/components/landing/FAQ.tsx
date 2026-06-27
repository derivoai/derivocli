import { motion } from 'motion/react';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

const faqs = [
  {
    question: "Does this replace Docker Compose?",
    answer: "No. Derivo orchestrates and verifies your existing local tools. If you use Docker Compose, Derivo validates that Docker is running, resolves any active port conflicts first, and then executes docker-compose commands safely."
  },
  {
    question: "Do I need an account to use the CLI?",
    answer: "No account is required for individual local usage. The offline command-line utility functions entirely on your machine. Accounts are only needed if you want to sync encrypted workspace configurations with team members."
  },
  {
    question: "What environments and frameworks are supported?",
    answer: "We support Node.js, Bun, pnpm, Docker, PostgreSQL, Redis, Next.js, and NestJS out of the box. Extensible plugin configurations can be declared inside your local derivo.json."
  },
  {
    question: "Is my repository source code sent to your servers?",
    answer: "Never. Derivo operates completely local-first. We only scan structural file manifests (like package.json or docker-compose.yml) to understand dependency constraints. Your code never leaves your local file system."
  }
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
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-12 border-t border-white/[0.06] pt-16">
        <div className="md:w-1/3">
          <span className="text-[11px] font-mono tracking-widest text-white/30 uppercase">Support</span>
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mt-3">FAQ</h2>
          <p className="mt-4 text-sm text-white/50 leading-relaxed font-light">
            Answers to common questions about Derivo's architecture and local verification capabilities.
          </p>
        </div>

        <div className="md:w-2/3 space-y-3 w-full">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 15, scale: 0.98, rotateX: 10 }}
                whileInView={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                style={{ transformPerspective: 1000 }}
                transition={{ duration: 0.6, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
                className="border border-white/[0.04] rounded-xl bg-gradient-to-r from-white/[0.02] to-white/[0.01] backdrop-blur-sm overflow-hidden hover:bg-white/[0.03] hover:border-white/[0.08] hover:shadow-[0_10px_20px_-10px_rgba(255,255,255,0.05)] transition-all duration-300"
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
                  <ChevronDown className={cn("w-4 h-4 text-white/30 transition-transform duration-300 shrink-0 ml-4", isOpen && "rotate-180")} />
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
                  <div className="px-6 pb-6 text-xs text-white/50 leading-relaxed font-light">
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
