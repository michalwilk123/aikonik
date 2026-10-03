// Hand-authored "folded paper" Kraków landmarks, drawn in the same flat-facet
// style as lajkonik.tsx: polygons only, each surface split into light / base /
// shade, no outlines, no gradients. Small toy-like dioramas for card art.
const C = {
  red: "#C62832",
  redShade: "#A81F29",
  redLight: "#DE3B44",
  navy: "#1B2340",
  navyLight: "#2C3763",
  gold: "#F2A81D",
  goldLight: "#F7C94B",
  goldShade: "#D88E10",
  beige: "#E6DCD0",
  dark: "#3A3A40",
  brick: "#B5523B",
  brickLight: "#CC6A4E",
  brickShade: "#93402F",
  stone: "#EBDDC0",
  stoneLight: "#F8EFDC",
  stoneShade: "#CDB994",
  patina: "#4E9C8A",
  patinaLight: "#6DB8A4",
  patinaShade: "#37786A",
  grass: "#7DB05A",
  grassLight: "#97C673",
  grassShade: "#5E9444",
} as const;

function Poly({ p, f }: { p: string; f: string }) {
  return <polygon points={p} fill={f} stroke={f} strokeWidth="0.6" />;
}

function Ground({ cx, cy, rx }: { cx: number; cy: number; rx: number }) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry="6" fill={C.beige} />;
}

/** Pointed gothic window (navy), x = left edge, y = bottom. */
function Win({
  x,
  y,
  w = 6,
  h = 16,
}: {
  x: number;
  y: number;
  w?: number;
  h?: number;
}) {
  const top = y - h;
  return (
    <polygon
      points={`${x},${y} ${x},${top + w * 0.6} ${x + w / 2},${top} ${x + w},${top + w * 0.6} ${x + w},${y}`}
      fill={C.navy}
    />
  );
}

/** Square-ish block tower body split into three vertical facets. */
function Block({
  x,
  y,
  w,
  h,
  light,
  base,
  shade,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  light: string;
  base: string;
  shade: string;
}) {
  const a = x + w * 0.3;
  const b = x + w * 0.68;
  const y2 = y + h;
  return (
    <g>
      <Poly p={`${x},${y} ${a},${y} ${a},${y2} ${x},${y2}`} f={light} />
      <Poly p={`${a},${y} ${b},${y} ${b},${y2} ${a},${y2}`} f={base} />
      <Poly p={`${b},${y} ${x + w},${y} ${x + w},${y2} ${b},${y2}`} f={shade} />
    </g>
  );
}

/** Pyramid roof on a square base, three facets. */
function Cone({
  x,
  w,
  y,
  top,
  ax,
  light,
  base,
  shade,
}: {
  x: number;
  w: number;
  y: number;
  top: number;
  ax: number;
  light: string;
  base: string;
  shade: string;
}) {
  const a = x + w * 0.3;
  const b = x + w * 0.68;
  return (
    <g>
      <Poly p={`${x},${y} ${ax},${top} ${a},${y}`} f={light} />
      <Poly p={`${a},${y} ${ax},${top} ${b},${y}`} f={base} />
      <Poly p={`${b},${y} ${ax},${top} ${x + w},${y}`} f={shade} />
    </g>
  );
}

/** St. Mary's Basilica (native box: x 0-120, y 0-200). */
export function MariackiShapes({ ground = true }: { ground?: boolean }) {
  return (
    <g>
      {ground ? <Ground cx={60} cy={192} rx={58} /> : null}
      {/* nave roof + wall */}
      <Poly p="0,150 60,116 60,150" f={C.navyLight} />
      <Poly p="60,116 120,150 60,150" f={C.navy} />
      <Block
        x={4}
        y={148}
        w={112}
        h={42}
        light={C.brickLight}
        base={C.brick}
        shade={C.brickShade}
      />
      <Win x={55} y={178} w={6} h={20} />
      <Win x={64} y={178} w={6} h={20} />
      <Win x={84} y={178} w={5} h={14} />
      <Win x={108} y={178} w={5} h={14} />
      <Poly p="4,184 116,184 116,190 4,190" f={C.brickShade} />

      {/* tall tower with gothic spire */}
      <Block
        x={12}
        y={66}
        w={38}
        h={124}
        light={C.brickLight}
        base={C.brick}
        shade={C.brickShade}
      />
      <Poly p="10,112 52,112 52,118 10,118" f={C.stone} />
      <Win x={26} y={104} w={8} h={22} />
      <Win x={26} y={160} w={8} h={20} />
      <Poly p="10,184 52,184 52,190 10,190" f={C.brickShade} />
      {/* belfry stone band */}
      <Block
        x={9}
        y={58}
        w={44}
        h={10}
        light={C.stoneLight}
        base={C.stone}
        shade={C.stoneShade}
      />
      {/* corner turrets */}
      <Block
        x={8}
        y={42}
        w={9}
        h={18}
        light={C.brickLight}
        base={C.brick}
        shade={C.brickShade}
      />
      <Cone
        x={7}
        w={11}
        y={42}
        top={26}
        ax={12.5}
        light={C.patinaLight}
        base={C.patina}
        shade={C.patinaShade}
      />
      <Block
        x={45}
        y={42}
        w={9}
        h={18}
        light={C.brickLight}
        base={C.brick}
        shade={C.brickShade}
      />
      <Cone
        x={44}
        w={11}
        y={42}
        top={26}
        ax={49.5}
        light={C.patinaLight}
        base={C.patina}
        shade={C.patinaShade}
      />
      {/* central gothic spire */}
      <Cone
        x={17}
        w={28}
        y={58}
        top={5}
        ax={31}
        light={C.patinaLight}
        base={C.patina}
        shade={C.patinaShade}
      />
      <Win x={28} y={58} w={6} h={10} />
      {/* gold crown */}
      <Poly p="23,36 39,36 41,26 36,30 31,22 26,30 21,26" f={C.gold} />
      <Poly p="23,36 31,36 31,22 26,30 21,26" f={C.goldLight} />
      <Poly p="31,36 39,36 41,26 36,30 31,22" f={C.goldShade} />
      <circle cx="31" cy="6" r="3" fill={C.gold} />

      {/* short tower with renaissance helmet */}
      <Block
        x={72}
        y={92}
        w={32}
        h={98}
        light={C.brickLight}
        base={C.brick}
        shade={C.brickShade}
      />
      <Poly p="70,124 106,124 106,130 70,130" f={C.stone} />
      <Win x={84} y={118} w={8} h={20} />
      <Win x={84} y={170} w={8} h={20} />
      <Poly p="70,184 106,184 106,190 70,190" f={C.brickShade} />
      <Block
        x={69}
        y={84}
        w={38}
        h={10}
        light={C.stoneLight}
        base={C.stone}
        shade={C.stoneShade}
      />
      {/* helmet dome */}
      <Poly p="72,84 88,56 88,84" f={C.patinaLight} />
      <Poly p="88,56 104,84 88,84" f={C.patinaShade} />
      <Poly p="80,84 88,56 96,84" f={C.patina} />
      <Block
        x={82}
        y={44}
        w={12}
        h={14}
        light={C.stoneLight}
        base={C.stone}
        shade={C.stoneShade}
      />
      <Poly p="82,44 88,30 94,44" f={C.patina} />
      <Poly p="88,30 94,44 88,44" f={C.patinaShade} />
      <circle cx="88" cy="26" r="4" fill={C.gold} />
      <Poly p="88,22 92,26 88,26" f={C.goldLight} />
    </g>
  );
}
