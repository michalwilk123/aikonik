import { LajkonikShapes } from "@/app/_components/lajkonik";

// Landing hero: a waving paper-style Lajkonik on a transparent background.
// Pure SVG; motion is CSS and only runs when the visitor has not asked for
// reduced motion.
export function HeroArt({
  className,
  title,
}: {
  className?: string;
  title: string;
}) {
  return (
    <svg
      viewBox="58 -4 292 450"
      className={className}
      role="img"
      focusable="false"
    >
      <title>{title}</title>
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .hx-rider { animation: hx-bob 6s ease-in-out infinite; }
          @keyframes hx-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        }
      `}</style>
      <g className="hx-rider">
        <LajkonikShapes waving />
      </g>
    </svg>
  );
}
