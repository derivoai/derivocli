export function Logo({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <img
      src="/icon.png"
      alt="Derivo"
      width={48}
      height={48}
      decoding="async"
      className={`${className} object-contain`}
    />
  );
}
