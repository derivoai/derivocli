import { useEffect, useRef, useState } from 'react';
import { useInView } from 'motion/react';
import { cn } from '../../lib/utils';

interface TypewriterTextProps {
  text: string;
  className?: string;
  speed?: number;
  delay?: number;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  once?: boolean;
}

export function TypewriterText({
  text,
  className,
  speed = 30,
  delay = 0,
  as: Tag = 'span',
  once = true
}: TypewriterTextProps) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref as React.RefObject<Element>, { once, margin: '-80px' });
  const [displayed, setDisplayed] = useState('');
  const [started, setStarted] = useState(false);
  const charIdx = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isInView) return;
    
    const startTimeout = setTimeout(() => {
      setStarted(true);
    }, delay);

    return () => clearTimeout(startTimeout);
  }, [isInView, delay]);

  useEffect(() => {
    if (!started) return;

    charIdx.current = 0;
    setDisplayed('');

    const tick = () => {
      if (charIdx.current < text.length) {
        charIdx.current++;
        setDisplayed(text.slice(0, charIdx.current));
        timerRef.current = setTimeout(tick, speed);
      }
    };

    timerRef.current = setTimeout(tick, 0);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [started, text, speed]);

  const isDone = displayed.length === text.length;

  return (
    // @ts-expect-error polymorphic ref
    <Tag ref={ref} className={cn('relative', className)}>
      {displayed}
      {!isDone && started && (
        <span className="inline-block w-[2px] h-[0.9em] ml-[1px] align-middle bg-white/80 animate-cursor-blink" />
      )}
      {!started && <span className="opacity-0">{text}</span>}
    </Tag>
  );
}
