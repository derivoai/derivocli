import DotField from './DotField';
import { Logo } from './Logo';

export function Background() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">

      {/* === DotField — full page interactive dot grid === */}
      <div className="absolute inset-0 z-0" style={{ pointerEvents: 'auto' }}>
        <DotField
          dotRadius={1}
          dotSpacing={24}
          bulgeStrength={80}
          glowRadius={200}
          cursorRadius={140}
          sparkle={false}
          waveAmplitude={0}
          gradientFrom="rgba(255, 255, 255, 0.18)"
          gradientTo="rgba(255, 255, 255, 0.08)"
          glowColor="rgba(255,255,255,0.04)"
        />
      </div>

      {/* === Ambient glow blobs — more visible === */}
      <div className="absolute top-[5%] left-[-10%] w-[60%] h-[35%] bg-white/[0.04] blur-[130px] rounded-full animate-drift" />
      <div className="absolute top-[20%] right-[-10%] w-[50%] h-[40%] bg-white/[0.035] blur-[150px] rounded-full animate-drift" style={{ animationDelay: '5s' }} />
      <div className="absolute bottom-[25%] left-[5%] w-[45%] h-[30%] bg-white/[0.03] blur-[140px] rounded-full animate-drift" style={{ animationDelay: '9s' }} />
      <div className="absolute bottom-[5%] right-[-5%] w-[50%] h-[30%] bg-white/[0.03] blur-[120px] rounded-full animate-drift" style={{ animationDelay: '13s' }} />

      {/* === Grid Pattern — more visible === */}
      <div
        className="absolute inset-0 opacity-[0.22]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.06) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.06) 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px',
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%)'
        }}
      />

      {/* === Large animated sphere — top left === */}
      <div className="absolute top-[8%] -left-[12%] md:-left-[6%] w-[450px] h-[450px] md:w-[700px] md:h-[700px] rounded-full bg-gradient-to-br from-white/[0.04] to-transparent backdrop-blur-3xl border border-white/[0.06] shadow-[inset_0_0_100px_rgba(255,255,255,0.015)] animate-float-orb" />

      {/* === Orbital rings === */}
      <div className="absolute top-[2%] -left-[8%] md:-left-[14%] w-[600px] h-[600px] md:w-[950px] md:h-[950px] rounded-full border border-white/[0.04] animate-spin-slow" />
      <div className="absolute top-[0%] -left-[15%] md:-left-[20%] w-[750px] h-[750px] md:w-[1150px] md:h-[1150px] rounded-full border border-white/[0.025] animate-spin-reverse-slow" />

      {/* === Floating dot particles === */}
      <div className="absolute top-[22%] left-[18%] md:left-[15%] w-3 h-3 rounded-full bg-white/25 shadow-[0_0_14px_rgba(255,255,255,0.3)] animate-float" style={{ animationDelay: '1s' }} />
      <div className="absolute top-[45%] right-[6%] w-2.5 h-2.5 rounded-full bg-white/20 shadow-[0_0_10px_rgba(255,255,255,0.2)] animate-float" style={{ animationDelay: '4s' }} />
      <div className="absolute bottom-[30%] left-[40%] w-2 h-2 rounded-full bg-white/[0.18] shadow-[0_0_10px_rgba(255,255,255,0.15)] animate-float-slow" style={{ animationDelay: '6s' }} />

      {/* === Center floating orb === */}
      <div className="absolute top-[30%] left-[50%] -translate-x-1/2 w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-tr from-white/[0.07] to-transparent backdrop-blur-md border border-white/[0.08] animate-float-slow" />

      {/* === Small orb top right === */}
      <div className="absolute top-[18%] right-[12%] md:right-[8%] w-10 h-10 md:w-14 md:h-14 rounded-full bg-gradient-to-tr from-white/[0.08] to-transparent backdrop-blur-md border border-white/[0.09] shadow-[0_0_24px_rgba(255,255,255,0.06)] animate-float" style={{ animationDelay: '2.5s' }} />

      {/* === Right geometric card with logo === */}
      <div className="absolute top-[12%] right-[-6%] md:right-[4%] w-[260px] h-[260px] md:w-[420px] md:h-[420px] rotate-12 bg-gradient-to-bl from-white/[0.04] to-transparent backdrop-blur-2xl border border-white/[0.07] rounded-[4rem] shadow-[inset_0_0_60px_rgba(255,255,255,0.02)] flex items-center justify-center animate-float-slow" style={{ animationDelay: '3s' }}>
        <Logo className="w-12 h-12 md:w-20 md:h-20 text-white/[0.12] -rotate-12" />
      </div>

      {/* === Large animated sphere — bottom right === */}
      <div className="absolute bottom-[8%] right-[-12%] md:right-[-6%] w-[380px] h-[380px] md:w-[560px] md:h-[560px] rounded-full bg-gradient-to-tl from-white/[0.035] to-transparent backdrop-blur-3xl border border-white/[0.05] shadow-[inset_0_0_80px_rgba(255,255,255,0.015)] animate-float-orb" style={{ animationDelay: '3s' }} />

      {/* === Bottom-left accent box === */}
      <div className="absolute bottom-[18%] left-[-6%] md:left-[4%] w-[220px] h-[220px] md:w-[320px] md:h-[320px] -rotate-12 bg-gradient-to-tr from-white/[0.03] to-transparent backdrop-blur-2xl border border-white/[0.06] rounded-[3rem] shadow-[inset_0_0_60px_rgba(255,255,255,0.02)] animate-float" style={{ animationDelay: '2s' }} />

      {/* === Diamond accents === */}
      <div className="absolute top-[60%] left-[8%] w-5 h-5 rotate-45 border border-white/[0.12] bg-white/[0.03] animate-float" style={{ animationDelay: '5s' }} />
      <div className="absolute top-[75%] right-[20%] w-3.5 h-3.5 rotate-45 border border-white/[0.1] animate-float-slow" style={{ animationDelay: '3.5s' }} />
      <div className="absolute top-[40%] left-[30%] w-2 h-2 rotate-45 border border-white/[0.08] animate-float" style={{ animationDelay: '7s' }} />

      {/* === Center top light burst === */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-white/[0.05] via-transparent to-transparent blur-[100px] animate-pulse-glow" />

      {/* === Subtle header border line === */}
      <div className="absolute top-24 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />
    </div>
  );
}
