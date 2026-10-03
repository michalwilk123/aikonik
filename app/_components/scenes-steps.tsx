// Mini comic scenes for the three "Jak to działa?" steps. Same folded-paper
// style as the mascots: flat light/base/shade facets, no outlines.

import { MariackiShapes } from "@/app/_components/krakow-landmarks";
import { LajkonikHeadShapes } from "@/app/_components/lajkonik";

type Props = { className?: string; title?: string };

const C = {
  red: "#C62832",
  redShade: "#A81F29",
  redLight: "#DE3B44",
  navy: "#1B2340",
  gold: "#F2A81D",
  goldLight: "#F7C94B",
  goldShade: "#E0861A",
  beige: "#E6DCD0",
  cream: "#F4EEE6",
  sky: "#FBE3E1",
} as const;

function Svg({
  className,
  title,
  children,
}: Props & { children: React.ReactNode }) {
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: title is optional; without it the SVG is aria-hidden (decorative)
    <svg
      viewBox="0 0 200 200"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .ss-bob { animation: ss-bob 2.6s ease-in-out infinite; }
          .ss-pop { transform-box: fill-box; transform-origin: 50% 100%; animation: ss-pop 2.6s ease-in-out infinite; }
          @keyframes ss-bob { 50% { transform: translateY(-5px); } }
          @keyframes ss-pop { 50% { transform: scale(1.06); } }
        }
      `}</style>
      <circle cx="100" cy="100" r="98" fill={C.sky} />
      {children}
    </svg>
  );
}

function Poly({ p, f }: { p: string; f: string }) {
  return <polygon points={p} fill={f} stroke={f} strokeWidth="0.6" />;
}

/** Lajkonik head with a speech bubble. */
export function StepWriteScene({ className, title }: Props) {
  return (
    <Svg className={className} title={title}>
      <g className="ss-pop">
        <Poly p="66,76 104,76 92,100" f={C.beige} />
        <Poly p="66,76 86,76 92,100" f={C.cream} />
        <Poly p="64,14 190,14 190,76 64,76" f={C.cream} />
        <Poly p="130,14 190,14 190,76 100,76" f={C.beige} />
        <rect x="80" y="28" width="86" height="10" rx="5" fill={C.navy} />
        <rect x="80" y="50" width="60" height="10" rx="5" fill={C.red} />
      </g>
      <g transform="translate(-92 70) scale(0.62)">
        <LajkonikHeadShapes />
      </g>
    </Svg>
  );
}

/** Magnifier held over a tiny Mariacki church. */
export function StepSearchScene({ className, title }: Props) {
  return (
    <Svg className={className} title={title}>
      <g transform="translate(26 30) scale(0.75)">
        <MariackiShapes />
      </g>
      <g className="ss-bob">
        <Poly p="146,112 160,100 188,150 172,162" f={C.redShade} />
        <Poly p="146,112 160,100 174,124 160,136" f={C.red} />
        <circle cx="122" cy="80" r="42" fill={C.gold} />
        <path d="M122 38 A42 42 0 0 1 164 80 L122 80Z" fill={C.goldShade} />
        <circle cx="122" cy="80" r="32" fill={C.cream} opacity="0.45" />
        <polygon points="100,70 112,58 117,63 105,76" fill="#FFFFFF" />
      </g>
    </Svg>
  );
}

/** A wax-sealed letter arrives for the Lajkonik. */
export function StepContactScene({ className, title }: Props) {
  return (
    <Svg className={className} title={title}>
      <g className="ss-bob">
        <g transform="rotate(-10 64 96)">
          <Poly p="14,62 114,62 114,128 14,128" f={C.cream} />
          <Poly p="64,62 114,62 114,128 14,128" f={C.beige} />
          <Poly p="14,62 114,62 64,100" f={C.redShade} />
          <Poly p="14,62 64,62 64,100" f={C.red} />
          <circle cx="64" cy="100" r="11" fill={C.gold} />
          <circle cx="61" cy="97" r="4.5" fill={C.goldLight} />
        </g>
      </g>
      <g transform="translate(4 74) scale(0.6)">
        <LajkonikHeadShapes />
      </g>
    </Svg>
  );
}

/** A sealed letter and a ringing phone, for the contact page. */
export function ContactPageScene({ className, title }: Props) {
  return (
    <Svg className={className} title={title}>
      <g className="ss-bob">
        <g transform="rotate(8 136 96)">
          <Poly p="108,36 164,36 164,156 108,156" f={C.red} />
          <Poly p="136,36 164,36 164,156 136,156" f={C.redShade} />
          <Poly p="116,50 156,50 156,134 116,134" f={C.cream} />
          <Poly p="136,50 156,50 156,134 136,134" f={C.beige} />
          <rect x="122" y="62" width="28" height="7" rx="3.5" fill={C.navy} />
          <rect x="122" y="76" width="20" height="7" rx="3.5" fill={C.red} />
          <circle cx="136" cy="145" r="5" fill={C.gold} />
        </g>
        <path
          d="M172 30 A20 20 0 0 1 184 50"
          fill="none"
          stroke={C.gold}
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M170 16 A34 34 0 0 1 196 46"
          fill="none"
          stroke={C.goldShade}
          strokeWidth="5"
          strokeLinecap="round"
        />
      </g>
      <g className="ss-pop">
        <g transform="rotate(-10 70 128)">
          <Poly p="18,94 122,94 122,162 18,162" f={C.cream} />
          <Poly p="70,94 122,94 122,162 18,162" f={C.beige} />
          <Poly p="18,94 122,94 70,134" f={C.redShade} />
          <Poly p="18,94 70,94 70,134" f={C.red} />
          <circle cx="70" cy="134" r="12" fill={C.gold} />
          <circle cx="67" cy="131" r="5" fill={C.goldLight} />
        </g>
      </g>
    </Svg>
  );
}
