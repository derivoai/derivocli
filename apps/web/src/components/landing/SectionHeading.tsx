import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

const ease = [0.16, 1, 0.3, 1] as const;

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  className?: string;
}

export function SectionHeading({ eyebrow, title, subtitle, className }: SectionHeadingProps) {
  return (
    <div
      className={cn('flex flex-col items-center text-center max-w-2xl mx-auto mb-16', className)}
    >
      <motion.span
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, ease }}
        className="px-3.5 py-1.5 rounded-full border border-white/[0.1] bg-white/[0.03] text-[10px] font-mono tracking-widest text-white/45 uppercase"
      >
        {eyebrow}
      </motion.span>

      <h2 className="mt-5 text-3xl md:text-5xl font-semibold tracking-tighter leading-[1.08]">
        {title.split(' ').map((word, i) => (
          <motion.span
            key={`${word}-${i}`}
            initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, delay: 0.15 + i * 0.07, ease }}
            className="inline-block mr-[0.26em] bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-transparent"
          >
            {word}
          </motion.span>
        ))}
      </h2>

      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.9, delay: 0.22, ease }}
          className="mt-5 text-base text-white/50 leading-relaxed font-light max-w-xl"
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}
