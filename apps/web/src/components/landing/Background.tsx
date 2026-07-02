export function Background() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
      {/* Warm ambient undertone */}
      <div
        className="absolute top-[30%] left-[10%] w-[500px] h-[500px] rounded-full opacity-50 animate-glow-breathe [animation-delay:-3s]"
        style={{
          background: 'radial-gradient(circle, rgba(251,191,36,0.05) 0%, transparent 70%)',
          filter: 'blur(90px)',
        }}
      />
      <div
        className="absolute top-[70%] right-[8%] w-[440px] h-[440px] rounded-full opacity-50 animate-glow-breathe [animation-delay:-5s]"
        style={{
          background: 'radial-gradient(circle, rgba(251,191,36,0.045) 0%, transparent 70%)',
          filter: 'blur(90px)',
        }}
      />

      {/* Ambient hero glow — Apple-style soft aurora */}
      <div
        className="absolute -top-[320px] left-1/2 -translate-x-1/2 w-[1100px] h-[700px] rounded-full animate-glow-breathe"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(99,102,241,0.22) 0%, rgba(139,92,246,0.10) 35%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />
      <div
        className="absolute -top-[180px] left-1/2 -translate-x-1/2 w-[640px] h-[420px] rounded-full animate-glow-breathe [animation-delay:-4s]"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(255,255,255,0.10) 0%, transparent 65%)',
          filter: 'blur(60px)',
        }}
      />

      {/* Faint side glows for depth */}
      <div
        className="absolute top-[22%] -left-[300px] w-[600px] h-[600px] rounded-full opacity-60"
        style={{
          background: 'radial-gradient(circle, rgba(56,189,248,0.05) 0%, transparent 70%)',
          filter: 'blur(90px)',
        }}
      />
      <div
        className="absolute top-[40%] -right-[300px] w-[600px] h-[600px] rounded-full opacity-60"
        style={{
          background: 'radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)',
          filter: 'blur(90px)',
        }}
      />

      {/* Mid-page ambient glow */}
      <div
        className="absolute top-[58%] left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full animate-glow-breathe [animation-delay:-2s]"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(99,102,241,0.07) 0%, transparent 70%)',
          filter: 'blur(90px)',
        }}
      />

      {/* Bottom glow, rising behind the CTA */}
      <div
        className="absolute -bottom-[280px] left-1/2 -translate-x-1/2 w-[1000px] h-[560px] rounded-full animate-glow-breathe [animation-delay:-6s]"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(139,92,246,0.12) 0%, rgba(99,102,241,0.05) 45%, transparent 72%)',
          filter: 'blur(80px)',
        }}
      />

      {/* Fine grid lines, faded top and bottom with a mask */}
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
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
