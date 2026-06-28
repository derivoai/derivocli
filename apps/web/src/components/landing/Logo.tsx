export function Logo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <img
      src="/icon.png"
      alt="Derivo"
      className={`${className} object-contain`}
    />
  );
}
