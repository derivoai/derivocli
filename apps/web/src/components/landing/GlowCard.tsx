import { useRef, useState, type ReactNode, type MouseEvent } from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

const ease = [0.16, 1, 0.3, 1] as const;

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  /** Stagger index for the reveal animation */
  index?: number;
  /** Disable the hover lift (e.g. for large panels) */
  lift?: boolean;
}

/**
 * Card with a mouse-tracking spotlight glow, hairline border and reveal animation.
 * The shared building block for all landing sections.
 */
export function GlowCard({ children, className, index = 0, lift = true }: GlowCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={lift ? { y: -4 } : undefined}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay: index * 0.06, ease }}
      className={cn(
        'group relative rounded-[28px] bg-white/[0.02] border border-white/[0.08] overflow-hidden',
        'hover:border-white/[0.16] transition-colors duration-300',
        className,
      )}
    >
      {/* Mouse-tracking spotlight */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none transition-opacity duration-500"
        style={{
          opacity: hovered ? 1 : 0,
          background: `radial-gradient(340px circle at ${pos.x}px ${pos.y}px, rgba(129,140,248,0.09), transparent 65%)`,
        }}
      />
      {/* Top hairline shine */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.14] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
      />
      <div className="relative z-10 h-full">{children}</div>
    </motion.div>
  );
}
