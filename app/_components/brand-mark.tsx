// Two overlapping rings: a need meeting a solution (social matchmaking).
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#091426" />
      <circle cx="12.5" cy="16" r="5" fill="#86f2e4" />
      <circle
        cx="19.5"
        cy="16"
        r="5"
        fill="none"
        stroke="#86f2e4"
        strokeWidth="2.5"
      />
    </svg>
  );
}
