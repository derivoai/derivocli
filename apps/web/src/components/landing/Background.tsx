/**
 * Subtle light background for white pages. Renders a faint dark grid on white
 * with a soft indigo radial glow. Purely decorative and non-interactive.
 */
export function Background() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none">
      {/* Soft indigo glow — top center, very low opacity */}
      <div
        className="absolute -top-[16rem] left-1/2 -translate-x-1/2 w-[60rem] h-[40rem] rounded-full"
        style={{
          background:
            'radial-gradient(circle at center, rgba(99,102,241,0.06) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
        aria-hidden="true"
      />

      {/* Faint grid lines, faded top and bottom with a mask */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0, 0, 0, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 0, 0, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px',
          maskImage:
            'linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)',
        }}
        aria-hidden="true"
      />
    </div>
  );
}
