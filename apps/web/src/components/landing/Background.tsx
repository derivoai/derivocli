import { lazy, Suspense, useEffect, useState, type CSSProperties } from 'react';

// DotField runs a requestAnimationFrame loop + global mousemove listener. Load
// its code lazily AND only mount it after first paint (idle) so it never adds
// to first-load main-thread work (TBT/TTI). Visuals are unchanged once mounted.
const DotField = lazy(() => import('./DotField'));

function useDeferredMount(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    // Respect reduced-motion: still mount (static grid), just not urgently.
    const idle =
      (window as unknown as { requestIdleCallback?: (cb: () => void) => number })
        .requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 200));
    const id = idle(() => setReady(true));
    return () => {
      const cancel = (window as unknown as { cancelIdleCallback?: (h: number) => void })
        .cancelIdleCallback;
      if (cancel) cancel(id as number);
      else clearTimeout(id as number);
    };
  }, []);
  return ready;
}

// Each glow is promoted to its own GPU compositor layer (translateZ + will-change)
// so the browser paints it once and only re-composites (cheap) during scroll,
// instead of repainting the blur filter on every frame.
const glowLayerStyle: CSSProperties = {
  willChange: 'transform',
  transform: 'translateZ(0)',
};

export function Background() {
  const showDotField = useDeferredMount();
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
      {/* ═══ Multi-Color Aurora Glows (subtle) ═══ */}

      {/* Hero — Top Left: Cyan → Indigo */}
      <div
        className="absolute -top-[20rem] -left-[10rem] w-[60rem] h-[60rem] rounded-full opacity-100"
        style={{
          ...glowLayerStyle,
          background:
            'radial-gradient(circle at center, rgba(6,182,212,0.25) 0%, rgba(99,102,241,0.15) 40%, transparent 70%)',
          filter: 'blur(120px)',
        }}
        aria-hidden="true"
      />

      {/* Hero — Top Right: Purple → Pink */}
      <div
        className="absolute -top-[10rem] -right-[10rem] w-[55rem] h-[55rem] rounded-full opacity-100"
        style={{
          ...glowLayerStyle,
          background:
            'radial-gradient(circle at center, rgba(147,51,234,0.18) 0%, rgba(236,72,153,0.08) 40%, transparent 70%)',
          filter: 'blur(120px)',
        }}
        aria-hidden="true"
      />

      {/* CLI Demo Backdrop Glow: Vibrant Blue/Indigo */}
      <div
        className="absolute top-[20rem] left-[10rem] w-[65rem] h-[65rem] rounded-full opacity-100"
        style={{
          ...glowLayerStyle,
          background:
            'radial-gradient(circle at center, rgba(37,99,235,0.24) 0%, rgba(6,182,212,0.12) 45%, transparent 70%)',
          filter: 'blur(140px)',
        }}
        aria-hidden="true"
      />

      {/* Mid Section — Left: Violet → Blue */}
      <div
        className="absolute top-[75rem] -left-[12rem] w-[55rem] h-[55rem] rounded-full opacity-100"
        style={{
          ...glowLayerStyle,
          background:
            'radial-gradient(circle at center, rgba(124,58,237,0.22) 0%, rgba(59,130,246,0.26) 40%, transparent 70%)',
          filter: 'blur(140px)',
        }}
        aria-hidden="true"
      />

      {/* Mid Section — Right: Emerald → Teal */}
      <div
        className="absolute top-[135rem] -right-[12rem] w-[50rem] h-[50rem] rounded-full opacity-100"
        style={{
          ...glowLayerStyle,
          background:
            'radial-gradient(circle at center, rgba(16,185,129,0.14) 0%, rgba(20,184,166,0.07) 40%, transparent 70%)',
          filter: 'blur(140px)',
        }}
        aria-hidden="true"
      />

      {/* Bottom — Left: Fuchsia → Rose */}
      <div
        className="absolute bottom-[80rem] -left-[8rem] w-[50rem] h-[50rem] rounded-full opacity-100"
        style={{
          ...glowLayerStyle,
          background:
            'radial-gradient(circle at center, rgba(217,70,239,0.14) 0%, rgba(244,63,94,0.07) 40%, transparent 70%)',
          filter: 'blur(140px)',
        }}
        aria-hidden="true"
      />

      {/* Bottom — Right: Teal → Cyan */}
      <div
        className="absolute bottom-[20rem] -right-[8rem] w-[55rem] h-[55rem] rounded-full opacity-100"
        style={{
          ...glowLayerStyle,
          background:
            'radial-gradient(circle at center, rgba(20,184,166,0.20) 0%, rgba(6,182,212,0.25) 40%, transparent 70%)',
          filter: 'blur(150px)',
        }}
        aria-hidden="true"
      />

      {/* Interactive dot grid — subtle, monochrome. Deferred to post-paint. */}
      <div className="absolute inset-0 z-0" style={{ pointerEvents: 'auto' }}>
        {showDotField && (
          <Suspense fallback={null}>
            <DotField
              dotRadius={1}
              dotSpacing={26}
              bulgeStrength={70}
              glowRadius={180}
              cursorRadius={130}
              sparkle={false}
              waveAmplitude={0}
              gradientFrom="rgba(255, 255, 255, 0.08)"
              gradientTo="rgba(255, 255, 255, 0.08)"
              glowColor="rgba(255,255,255,0.02)"
            />
          </Suspense>
        )}
      </div>

      {/* Fine grid lines, faded top and bottom with a mask */}
      <div
        className="absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.025) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.025) 1px, transparent 1px)
          `,
          backgroundSize: '72px 72px',
          maskImage:
            'linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)',
        }}
      />

      {/* Single hairline under the navbar */}
      <div className="absolute top-24 left-0 right-0 h-px bg-white/[0.04]" />
    </div>
  );
}
