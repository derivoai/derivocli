export function Logo({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Derivo logo"
    >
      {/* D shell — terminal window silhouette */}
      <path
        d="M11 5.5H16C22.9 5.5 26.5 10.2 26.5 16C26.5 21.8 22.9 26.5 16 26.5H11V5.5Z"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Prompt chevron inside the D */}
      <path
        d="M14.5 12.5L18.5 16L14.5 19.5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
