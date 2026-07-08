import { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

const ease = [0.16, 1, 0.3, 1] as const;

const faqs = [
  {
    q: 'Do I need an account to use the CLI?',
    a: 'Yes. Derivo requires an account, and you authenticate each machine by running "derivo login". Diagnostics and inspection work on the free tier; creating and setting up projects requires a Pro plan or an active trial.',
  },
  {
    q: 'Does this replace Docker Compose?',
    a: 'No. Derivo orchestrates and verifies your existing tools. If you use Docker Compose, it confirms Docker is running, resolves port conflicts first, then runs your compose commands safely.',
  },
  {
    q: 'What frameworks are supported?',
    a: 'Derivo detects Node.js and Bun; npm, pnpm, and yarn; Docker; PostgreSQL and Redis; and frameworks including Next.js, React, Express, NestJS, Prisma, Tailwind, and TypeScript out of the box.',
  },
  {
    q: 'Is my source code sent to your servers?',
    a: 'No. Your source code never leaves your machine. Derivo only reads structural manifests like package.json to understand your environment. Only account, device, and project metadata sync to your dashboard.',
  },
  {
    q: 'How is my session secured?',
    a: 'CLI sessions are encrypted at rest with AES-256-GCM and bound to your machine, so a copied credentials file will not work elsewhere. You can review sessions and revoke API keys anytime.',
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="w-full bg-secondary/40 py-28 md:py-36 scroll-mt-20">
      <div className="max-w-3xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease }}
          className="mb-12 text-center"
        >
          <span className="text-xs font-medium tracking-wide text-accent uppercase">Support</span>
          <h2 className="mt-3 font-display text-4xl md:text-5xl leading-[1.0] tracking-tight text-foreground">
            Frequently asked <span className="italic">questions</span>
          </h2>
        </motion.div>

        <div className="flex flex-col gap-3">
          {faqs.map((faq, i) => {
            const isOpen = open === i;
            return (
              <div
                key={i}
                className="rounded-xl border border-border bg-background overflow-hidden"
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm font-medium text-foreground">{faq.q}</span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 text-muted-foreground transition-transform shrink-0',
                      isOpen && 'rotate-180',
                    )}
                  />
                </button>
                <motion.div
                  initial={false}
                  animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <p className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
