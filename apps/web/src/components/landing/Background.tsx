import DotField from './DotField';

export function Background() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
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
          gradientFrom="rgba(255, 255, 255, 0.10)"
          gradientTo="rgba(255, 255, 255, 0.10)"
          glowColor="rgba(255,255,255,0.03)"
        />
      </div>

      {/* Fine grid lines, faded top and bottom with a mask */}
      <div
        className="absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.035) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.035) 1px, transparent 1px)
          `,
          backgroundSize: '72px 72px',
          maskImage:
            'linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)',
        }}
      />

      {/* Single hairline under the navbar */}
      <div className="absolute top-24 left-0 right-0 h-px bg-white/[0.06]" />
    </div>
  );
}
