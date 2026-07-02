import DotField from './DotField';

export function Background() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
      {/* ═══ Multi-Color Aurora Glows (subtle) ═══ */}

      {/* Hero — Top Left: Cyan → Indigo */}
      <div
        className="absolute -top-[20%] -left-[10%] w-[60rem] h-[60rem] rounded-full opacity-100"
        style={{
          background:
            'radial-gradient(circle at center, rgba(6,182,212,0.15) 0%, rgba(99,102,241,0.08) 40%, transparent 70%)',
          filter: 'blur(120px)',
        }}
        aria-hidden="true"
      />

      {/* Hero — Top Right: Purple → Pink */}
      <div
        className="absolute -top-[10%] -right-[10%] w-[55rem] h-[55rem] rounded-full opacity-100"
        style={{
          background:
            'radial-gradient(circle at center, rgba(147,51,234,0.13) 0%, rgba(236,72,153,0.06) 40%, transparent 70%)',
          filter: 'blur(120px)',
        }}
        aria-hidden="true"
      />

      {/* Mid Section — Left: Violet → Blue */}
      <div
        className="absolute top-[28%] -left-[12%] w-[55rem] h-[55rem] rounded-full opacity-100"
        style={{
          background:
            'radial-gradient(circle at center, rgba(124,58,237,0.10) 0%, rgba(59,130,246,0.05) 40%, transparent 70%)',
          filter: 'blur(140px)',
        }}
        aria-hidden="true"
      />

      {/* Mid Section — Right: Emerald → Teal */}
      <div
        className="absolute top-[42%] -right-[12%] w-[50rem] h-[50rem] rounded-full opacity-100"
        style={{
          background:
            'radial-gradient(circle at center, rgba(16,185,129,0.10) 0%, rgba(20,184,166,0.05) 40%, transparent 70%)',
          filter: 'blur(140px)',
        }}
        aria-hidden="true"
      />

      {/* Bottom — Left: Fuchsia → Rose */}
      <div
        className="absolute top-[70%] -left-[8%] w-[50rem] h-[50rem] rounded-full opacity-100"
        style={{
          background:
            'radial-gradient(circle at center, rgba(217,70,239,0.10) 0%, rgba(244,63,94,0.05) 40%, transparent 70%)',
          filter: 'blur(140px)',
        }}
        aria-hidden="true"
      />

      {/* Bottom — Right: Teal → Cyan */}
      <div
        className="absolute top-[85%] -right-[8%] w-[55rem] h-[55rem] rounded-full opacity-100"
        style={{
          background:
            'radial-gradient(circle at center, rgba(20,184,166,0.12) 0%, rgba(6,182,212,0.06) 40%, transparent 70%)',
          filter: 'blur(150px)',
        }}
        aria-hidden="true"
      />

      {/* Interactive dot grid — subtle, monochrome */}
      <div className="absolute inset-0 z-0" style={{ pointerEvents: 'auto' }}>
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
