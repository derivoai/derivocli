import { useEffect, useState } from 'react';
import { Logo } from '../landing/Logo';

/**
 * Apple-style boot splash: a centered brand mark with a thin, rounded
 * progress bar that fills steadily to 100% (like an iPhone starting up).
 * Shown on first load while the entire landing page is preloaded in the
 * background, then fades out once everything is ready.
 */
export function Splash({ hiding, duration = 2000 }: { hiding: boolean; duration?: number }) {
  // Fill the bar smoothly from 0 -> 100% across `duration`. Snap to 100 on
  // hide so it always completes before fading, matching the boot feel.
  const [fill, setFill] = useState(0);

  useEffect(() => {
    // Kick to 100% on the next frame so the CSS width transition animates.
    const id = requestAnimationFrame(() => setFill(100));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (hiding) setFill(100);
  }, [hiding]);

  return (
    <div
      className={`lightui fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background transition-opacity duration-500 ease-out ${
        hiding ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      aria-hidden={hiding}
      role="status"
    >
      <div className="flex flex-col items-center gap-10">
        <Logo className="w-16 h-16 text-foreground" />

        {/* Thin determinate track — the iPhone boot bar. */}
        <div className="h-[3px] w-44 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-accent"
            style={{
              width: `${fill}%`,
              transition: `width ${hiding ? 300 : duration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
