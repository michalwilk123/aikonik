// Landing "Dla kogo?" scenes: small folded-paper vignettes (blocky people,
// one comic landmark) in the same flat light/base/shade style.

import { MariackiShapes } from "@/app/_components/krakow-landmarks";

type Props = { className?: string; title?: string };

function Svg({
  className,
  title,
  children,
}: Props & { children: React.ReactNode }) {
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: title is optional; without it the SVG is aria-hidden (decorative)
    <svg
      viewBox="0 0 100 140"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .sa-bob { animation: sa-bob 2.6s ease-in-out infinite; }
          .sa-pulse { transform-box: fill-box; transform-origin: 50% 60%; animation: sa-pulse 1.6s ease-in-out infinite; }
          @keyframes sa-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-2.5px); } }
          @keyframes sa-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.14); } }
        }
      `}</style>
      {children}
    </svg>
  );
}

const C = {
  red: "#C62832",
  redShade: "#A81F29",
  redLight: "#DE3B44",
  navy: "#1B2340",
  navyLight: "#2C3763",
  gold: "#F2A81D",
  goldLight: "#F7C94B",
  beige: "#E6DCD0",
  cream: "#F4EEE6",
  blush: "#F08A8A",
  white: "#FFFFFF",
  grey: "#C9C9D0",
  greyShade: "#9A9AA6",
} as const;

function Poly({ p, f }: { p: string; f: string }) {
  return <polygon points={p} fill={f} stroke={f} strokeWidth="0.4" />;
}

function Ground({ cx, rx }: { cx: number; rx: number }) {
  return <ellipse cx={cx} cy="130" rx={rx} ry="3.5" fill={C.beige} />;
}

type Tone = { base: string; light: string; shade: string };
const SKIN: Tone = { base: "#F2B880", light: "#F8CD9F", shade: "#DE9C62" };
const SKIN2: Tone = { base: "#D79A6A", light: "#E5B085", shade: "#BC7C50" };
const SKIN3: Tone = { base: "#F6C9A0", light: "#FBDDBF", shade: "#E3AA7D" };
const tone = (b: string, l: string, s: string): Tone => ({
  base: b,
  light: l,
  shade: s,
});
const SHIRT_RED = tone(C.red, C.redLight, C.redShade);
const SHIRT_NAVY = tone(C.navyLight, "#3B4880", C.navy);
const SHIRT_GOLD = tone(C.gold, C.goldLight, "#D88E10");
const SHIRT_TEAL = tone("#4E9C8A", "#6DB8A4", "#37786A");

/**
 * Blocky paper person, feet at (0,0), ~72 units tall (facing front). Local
 * frame: x -15..15, y -72..0. Place and scale with a transform.
 */
function Person({
  skin = SKIN,
  shirt = SHIRT_NAVY,
  pants = tone(C.navy, C.navyLight, "#10152B"),
  hair,
  hairStyle = "short",
  glasses = false,
  mouth = "smile",
}: {
  skin?: Tone;
  shirt?: Tone;
  pants?: Tone;
  hair: Tone;
  hairStyle?: "short" | "bun" | "cap" | "bald" | "bob";
  glasses?: boolean;
  mouth?: "smile" | "open";
}) {
  return (
    <g>
      {/* legs */}
      <Poly p="-10,-24 -1,-24 -1,-4 -10,-4" f={pants.light} />
      <Poly p="1,-24 10,-24 10,-4 1,-4" f={pants.base} />
      <Poly p="1,-24 10,-24 10,-4 5,-4" f={pants.shade} />
      <Poly p="-12,-4 -1,-4 -1,0 -12,0" f={C.navy} />
      <Poly p="1,-4 12,-4 12,0 1,0" f={C.navy} />
      {/* arms */}
      <Poly p="-20,-46 -14,-46 -14,-27 -20,-27" f={shirt.light} />
      <Poly p="14,-46 20,-46 20,-27 14,-27" f={shirt.shade} />
      <rect x="-20" y="-28" width="6" height="5" fill={skin.base} />
      <rect x="14" y="-28" width="6" height="5" fill={skin.shade} />
      {/* torso */}
      <Poly p="-15,-48 15,-48 15,-22 -15,-22" f={shirt.base} />
      <Poly p="0,-48 15,-48 15,-22 4,-22" f={shirt.shade} />
      <Poly p="-15,-48 -4,-48 -15,-34" f={shirt.light} />
      {/* neck */}
      <rect x="-4" y="-51" width="8" height="4" fill={skin.shade} />
      {/* head */}
      <Poly p="-13,-74 13,-74 13,-50 -13,-50" f={skin.base} />
      <Poly p="3,-74 13,-74 13,-50 -2,-50" f={skin.shade} />
      <Poly p="-13,-74 -3,-74 -13,-62" f={skin.light} />
      {/* hair */}
      {hairStyle === "short" ? (
        <>
          <Poly p="-14,-76 14,-76 14,-66 -14,-66" f={hair.base} />
          <Poly p="2,-76 14,-76 14,-66 4,-66" f={hair.shade} />
          <Poly p="-14,-76 -4,-76 -14,-70" f={hair.light} />
        </>
      ) : null}
      {hairStyle === "bob" ? (
        <>
          <Poly p="-15,-77 15,-77 15,-64 -15,-64" f={hair.base} />
          <Poly p="-15,-64 -11,-64 -11,-48 -15,-48" f={hair.base} />
          <Poly p="11,-64 15,-64 15,-48 11,-48" f={hair.shade} />
          <Poly p="2,-77 15,-77 15,-64 4,-64" f={hair.shade} />
          <Poly p="-15,-77 -4,-77 -15,-70" f={hair.light} />
        </>
      ) : null}
      {hairStyle === "bun" ? (
        <>
          <Poly p="-8,-84 8,-84 8,-76 -8,-76" f={hair.shade} />
          <Poly p="-14,-76 14,-76 14,-65 -14,-65" f={hair.base} />
          <Poly p="2,-76 14,-76 14,-65 4,-65" f={hair.shade} />
          <Poly p="-14,-76 -4,-76 -14,-70" f={hair.light} />
        </>
      ) : null}
      {hairStyle === "cap" ? (
        <>
          <Poly p="-14,-77 14,-77 14,-67 -14,-67" f={C.red} />
          <Poly p="2,-77 14,-77 14,-67 4,-67" f={C.redShade} />
          <Poly p="-14,-77 -4,-77 -14,-71" f={C.redLight} />
          <Poly p="-14,-68 20,-68 20,-64 -14,-64" f={C.redShade} />
        </>
      ) : null}
      {hairStyle === "bald" ? (
        <>
          <Poly p="-15,-70 -13,-70 -13,-58 -15,-58" f={hair.base} />
          <Poly p="13,-70 15,-70 15,-58 13,-58" f={hair.shade} />
          <Poly p="-13,-74 13,-74 13,-71 -13,-71" f={hair.light} />
        </>
      ) : null}
      {/* eyes, cheeks, mouth */}
      <rect x="-8" y="-65" width="4.5" height="8" rx="1" fill={C.navy} />
      <rect x="3.5" y="-65" width="4.5" height="8" rx="1" fill={C.navy} />
      <rect x="-11" y="-57" width="5" height="3" fill={C.blush} opacity="0.7" />
      <rect x="6" y="-57" width="5" height="3" fill={C.blush} opacity="0.7" />
      {mouth === "open" ? (
        <rect x="-3" y="-56" width="6" height="4" rx="1.5" fill={C.navy} />
      ) : (
        <polygon points="-4,-55 4,-55 2,-52 -2,-52" fill={C.navy} />
      )}
      {glasses ? (
        <g fill="none" stroke={C.navy} strokeWidth="1.4">
          <rect x="-10" y="-67" width="8.5" height="12" />
          <rect x="1.5" y="-67" width="8.5" height="12" />
          <line x1="-1.5" y1="-62" x2="1.5" y2="-62" />
        </g>
      ) : null}
    </g>
  );
}

function Heart({
  s = 1,
  f = C.red,
  l = C.redLight,
}: {
  s?: number;
  f?: string;
  l?: string;
}) {
  return (
    <g transform={`scale(${s})`}>
      <Poly p="-12,-6 -6,-12 0,-8 6,-12 12,-6 12,0 0,12 -12,0" f={f} />
      <Poly p="0,-8 6,-12 12,-6 12,0 0,12" f={C.redShade} />
      <Poly p="-12,-6 -6,-12 -2,-9 -8,-3" f={l} />
    </g>
  );
}

function Pigeon() {
  return (
    <g>
      <Poly p="-9,-8 6,-8 9,0 -8,0" f={C.grey} />
      <Poly p="0,-8 6,-8 9,0 2,0" f={C.greyShade} />
      <Poly p="-9,-3 -17,-6 -9,0" f={C.greyShade} />
      <Poly p="3,-14 10,-14 10,-8 3,-8" f={C.grey} />
      <Poly p="10,-12 14,-11 10,-9" f={C.gold} />
      <rect x="6" y="-12.5" width="2" height="2.5" fill={C.navy} />
      <rect x="-4" y="0" width="1.5" height="3" fill={C.gold} />
      <rect x="1" y="0" width="1.5" height="3" fill={C.gold} />
      <Poly p="3,-6 8,-6 6,-3" f="#7BC4A8" />
    </g>
  );
}

const GREY_HAIR = tone("#E4E4EA", C.white, "#B8B8C4");
const BROWN = tone("#6B4630", "#8A6045", "#4E3020");
const BLOND = tone("#E8B84A", "#F5D27A", "#C48F2A");
const BLACK = tone("#2A2A33", "#44444F", "#16161C");

export function ResidentsScene({ className, title }: Props) {
  return (
    <Svg className={className} title={title}>
      <Ground cx={50} rx={44} />
      {/* parent + child holding hands */}
      <g transform="translate(30 129) scale(1.02)">
        <Person shirt={SHIRT_RED} hair={BROWN} hairStyle="bob" skin={SKIN3} />
      </g>
      <g transform="translate(72 129) scale(0.66)">
        <Person
          shirt={SHIRT_GOLD}
          hair={BLOND}
          hairStyle="short"
          mouth="open"
          skin={SKIN}
          pants={tone("#4E6FA8", "#6A8BC4", "#3A5688")}
        />
      </g>
      <rect x="49" y="95" width="11" height="4" fill={SKIN3.shade} />
    </Svg>
  );
}

export function SeniorsScene({ className, title }: Props) {
  return (
    <Svg className={className} title={title}>
      <Ground cx={50} rx={44} />
      <g transform="translate(80 98)">
        <g className="sa-bob">
          <Pigeon />
        </g>
      </g>
      {/* senior with cane */}
      <g transform="translate(42 129) scale(1.15)">
        <Person
          shirt={SHIRT_TEAL}
          hair={GREY_HAIR}
          hairStyle="bun"
          glasses
          skin={SKIN3}
          pants={tone("#6B5A7A", "#85749A", "#4C3E5A")}
        />
        <Poly p="-23,-30 -20,-30 -20,0 -23,0" f="#8A5A32" />
        <Poly p="-23,-33 -15,-33 -15,-30 -23,-30" f="#8A5A32" />
      </g>
    </Svg>
  );
}

export function NgoScene({ className, title }: Props) {
  return (
    <Svg className={className} title={title}>
      <Ground cx={50} rx={44} />
      {/* volunteer in a red vest */}
      <g transform="translate(50 129) scale(1.15)">
        <Person
          shirt={SHIRT_NAVY}
          hair={BLACK}
          hairStyle="short"
          skin={SKIN2}
          mouth="open"
        />
        <Poly p="-15,-48 -5,-48 -3,-22 -15,-22" f={C.red} />
        <Poly p="5,-48 15,-48 15,-22 3,-22" f={C.redShade} />
        <rect x="-15" y="-36" width="12" height="2.5" fill={C.goldLight} />
        <rect x="3" y="-36" width="12" height="2.5" fill={C.gold} />
      </g>
      <g transform="translate(50 26)">
        <g className="sa-pulse">
          <Heart s={1.2} />
        </g>
      </g>
    </Svg>
  );
}

export function MunicipalityScene({ className, title }: Props) {
  return (
    <Svg className={className} title={title}>
      <Ground cx={50} rx={46} />
      <g transform="translate(13 12) scale(0.62)">
        <MariackiShapes ground={false} />
        <rect x="43.5" y="-14" width="2" height="18" fill={C.navy} />
        <Poly p="45,-14 66,-8 45,-2" f={C.red} />
      </g>
    </Svg>
  );
}
