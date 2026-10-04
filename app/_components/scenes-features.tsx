// Scenes for the landing page agent cards. The mascot and dragon are reused
// unchanged; props are drawn in the same flat "folded paper" style.
import { LajkonikShapes } from "@/app/_components/lajkonik";
import { SmokShapes } from "@/app/_components/smok";

type Props = { className?: string; title?: string };

const C = {
  red: "#C62832",
  redShade: "#A81F29",
  redLight: "#DE3B44",
  navy: "#1B2340",
  gold: "#F2A81D",
  goldLight: "#F7C94B",
  goldShade: "#D88E10",
  beige: "#E6DCD0",
  cream: "#F4EEE6",
  white: "#FFFFFF",
  wood: "#B5855A",
  woodLight: "#CFA173",
  woodShade: "#8F6742",
  sky: "#DCEBF2",
} as const;

function Svg({
  className,
  title,
  viewBox,
  children,
}: Props & { viewBox: string; children: React.ReactNode }) {
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: title is optional; without it the SVG is aria-hidden (decorative)
    <svg
      viewBox={viewBox}
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .sf-bob { animation: sf-bob 2.4s ease-in-out infinite; }
          .sf-glow { transform-box: fill-box; transform-origin: 50% 50%; animation: sf-glow 2s ease-in-out infinite; }
          @keyframes sf-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
          @keyframes sf-glow { 0%,100% { transform: scale(1); } 50% { transform: scale(1.08); } }
        }
      `}</style>
      {children}
    </svg>
  );
}

function Poly({ p, f }: { p: string; f: string }) {
  return <polygon points={p} fill={f} stroke={f} strokeWidth="0.6" />;
}

function Bar({
  x,
  top,
  c,
  l,
  s,
}: {
  x: number;
  top: number;
  c: string;
  l: string;
  s: string;
}) {
  return (
    <g>
      <Poly p={`${x},${top} ${x + 44},${top} ${x + 44},168 ${x},168`} f={c} />
      <Poly p={`${x},${top} ${x + 14},${top} ${x + 14},168 ${x},168`} f={l} />
      <Poly
        p={`${x + 32},${top} ${x + 44},${top} ${x + 44},168 ${x + 32},168`}
        f={s}
      />
    </g>
  );
}

function Signpost() {
  return (
    <g>
      <Poly p="0,0 8,0 8,120 0,120" f={C.woodLight} />
      <Poly p="5,0 8,0 8,120 5,120" f={C.woodShade} />
      <Poly p="-34,14 36,14 52,29 36,44 -34,44" f={C.gold} />
      <Poly p="-34,14 36,14 44,22 -34,22" f={C.goldLight} />
      <Poly p="-34,38 36,38 36,44 -34,44" f={C.goldShade} />
      <Poly p="46,52 -22,52 -38,66 -22,80 46,80" f={C.red} />
      <Poly p="46,52 -22,52 -30,59 46,59" f={C.redLight} />
      <Poly p="46,74 -22,74 -22,80 46,80" f={C.redShade} />
    </g>
  );
}

function Bulb({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g className="sf-glow">
        <Poly p="-34,-64 -22,-62 -26,-56" f={C.goldLight} />
        <Poly p="34,-64 22,-62 26,-56" f={C.goldLight} />
        <Poly p="0,-86 0,-72 -8,-76" f={C.goldLight} />
      </g>
      <Poly p="0,-52 -22,-36 -22,-14 -10,4 10,4 22,-14 22,-36" f={C.gold} />
      <Poly p="0,-52 -22,-36 -22,-14 -12,-10 -6,-34" f={C.goldLight} />
      <Poly p="0,-52 22,-36 22,-14 10,4 0,4" f={C.goldShade} />
      <Poly p="-10,4 10,4 10,14 -10,14" f={C.beige} />
      <Poly p="-10,14 10,14 6,22 -6,22" f="#9AA0B5" />
      <Poly p="-6,-22 -2,-22 0,-12 2,-22 6,-22 2,-8 -2,-8" f={C.white} />
    </g>
  );
}

// Waving Lajkonik pointing the way with a signpost.
export function SupportScene({ className, title }: Props) {
  return (
    <Svg className={className} title={title} viewBox="4 0 246 200">
      <ellipse cx="120" cy="186" rx="112" ry="8" fill={C.beige} />
      <g transform="translate(66 62) scale(-1 1)">
        <Signpost />
      </g>
      <g transform="translate(78 -2) scale(0.43)">
        <LajkonikShapes waving />
      </g>
    </Svg>
  );
}

// Three chunky bars: data and statistics.
export function DataScene({ className, title }: Props) {
  return (
    <Svg className={className} title={title} viewBox="0 0 200 180">
      <ellipse cx="100" cy="170" rx="86" ry="7" fill={C.beige} />
      <Bar x={30} top={110} c={C.navy} l="#2E3A63" s="#121830" />
      <Bar x={78} top={70} c={C.gold} l={C.goldLight} s={C.goldShade} />
      <Bar x={126} top={30} c={C.red} l={C.redLight} s={C.redShade} />
    </Svg>
  );
}

// A clipboard with a green tick: a small test.
export function TestScene({ className, title }: Props) {
  return (
    <Svg className={className} title={title} viewBox="0 0 200 180">
      <ellipse cx="100" cy="170" rx="70" ry="7" fill={C.beige} />
      <Poly p="46,22 154,22 154,166 46,166" f={C.wood} />
      <Poly p="46,22 70,22 70,166 46,166" f={C.woodLight} />
      <Poly p="134,22 154,22 154,166 134,166" f={C.woodShade} />
      <Poly p="58,36 142,36 142,154 58,154" f={C.white} />
      <Poly p="110,36 142,36 142,154 96,154" f={C.cream} />
      <Poly p="78,12 122,12 122,40 78,40" f={C.navy} />
      <rect x="72" y="56" width="56" height="9" rx="4.5" fill={C.beige} />
      <rect x="72" y="76" width="40" height="9" rx="4.5" fill={C.beige} />
      <Poly p="70,116 84,104 98,118 128,90 140,102 98,142" f="#3E9A53" />
      <Poly p="70,116 84,104 98,118 98,142" f="#5DB36A" />
    </Svg>
  );
}

// A sprout growing in a pot: an idea taking root in a new place.
export function RolloutScene({ className, title }: Props) {
  return (
    <Svg className={className} title={title} viewBox="0 0 200 180">
      <ellipse cx="100" cy="170" rx="70" ry="7" fill={C.beige} />
      <Poly p="96,120 104,120 104,60 96,60" f="#3E9A53" />
      <Poly p="100,86 60,62 54,34 92,52" f="#5DB36A" />
      <Poly p="100,86 54,34 92,52" f="#3E9A53" />
      <Poly p="100,70 140,44 150,14 110,34" f="#5DB36A" />
      <Poly p="100,70 150,14 110,34" f="#2E7D45" />
      <Poly p="52,112 148,112 136,168 64,168" f={C.red} />
      <Poly p="52,112 92,112 88,168 64,168" f={C.redLight} />
      <Poly p="118,112 148,112 136,168 116,168" f={C.redShade} />
      <Poly p="46,104 154,104 154,122 46,122" f={C.gold} />
      <Poly p="46,104 154,104 154,110 46,110" f={C.goldLight} />
    </Svg>
  );
}

// The dragon with a bright idea.
export function IdeaScene({ className, title }: Props) {
  return (
    <Svg className={className} title={title} viewBox="0 0 230 200">
      <ellipse cx="96" cy="188" rx="86" ry="8" fill={C.beige} />
      <g transform="translate(-4 56) scale(0.7)">
        <SmokShapes pose="sit" />
      </g>
      <Bulb x={180} y={100} s={1.1} />
    </Svg>
  );
}
