// Hand-authored "folded paper" Lajkonik: flat polygon facets in light/shade
// tones fake the 3D look. Palette comes from the AiKonik brand brief.
const C = {
  red: "#C62832",
  redShade: "#A81F29",
  redLight: "#DE3B44",
  navy: "#1B2340",
  fur: "#2A2A33",
  furLight: "#44444F",
  gold: "#F2A81D",
  goldLight: "#F7C94B",
  orange: "#F59E2B",
  orangeShade: "#E0861A",
  white: "#D9A66B",
  grey: "#B98450",
  greyDark: "#8F6035",
  dark: "#3A3A40",
  beige: "#E6DCD0",
} as const;

function Poly({ p, f }: { p: string; f: string }) {
  return <polygon points={p} fill={f} stroke={f} strokeWidth="0.6" />;
}

/** Rider head: plume, hat, band and orange square face. Local frame ~ x 190-300, y 0-160. */
export function LajkonikHeadShapes() {
  return (
    <g>
      {/* plume */}
      <Poly p="246,34 262,4 276,0 268,24" f={C.gold} />
      <Poly p="246,34 262,4 258,28" f={C.goldLight} />
      {/* hat cone */}
      <Poly p="204,88 250,30 250,88" f={C.red} />
      <Poly p="250,30 296,88 250,88" f={C.redShade} />
      <Poly p="218,72 250,30 258,72" f={C.redLight} />
      <polygon points="212,80 254,70 254,77 210,87" fill={C.redShade} />
      <polygon points="224,62 253,56 253,61 221,68" fill={C.redShade} />
      {/* fur band */}
      <Poly p="196,86 296,86 304,112 192,112" f={C.fur} />
      <Poly p="196,86 250,86 250,112 192,112" f={C.furLight} />
      <polygon points="214,88 218,88 216,111 211,111" fill={C.gold} />
      <polygon points="264,88 268,88 272,111 267,111" fill={C.gold} />
      {/* face */}
      <Poly p="206,112 290,112 290,176 206,176" f={C.orange} />
      <Poly p="262,112 290,112 290,176 250,176" f={C.orangeShade} />
      <Poly p="206,112 232,112 206,140" f="#FAB95A" />
      {/* eyes */}
      <rect x="224" y="128" width="9" height="18" rx="1.5" fill={C.navy} />
      <rect x="258" y="128" width="9" height="18" rx="1.5" fill={C.navy} />
    </g>
  );
}

function Spark({ x, y, r = 1 }: { x: number; y: number; r?: number }) {
  return (
    <polygon
      points={`${x},${y - 14 * r} ${x + 5 * r},${y} ${x},${y + 14 * r} ${x - 5 * r},${y}`}
      fill={C.gold}
    />
  );
}

/** Mascot shapes without an <svg> wrapper (native box: x 58-392, y -4-446), for composing scenes.
 * A man on his own legs wearing the hobby horse around his waist, not a rider on a horse. */
export function LajkonikShapes({ waving = false }: { waving?: boolean }) {
  return (
    <g>
      {waving ? (
        <style>{`
          @media (prefers-reduced-motion: no-preference) {
            .lj-wave { transform-box: fill-box; transform-origin: 85% 90%; animation: lj-wave 2.4s ease-in-out infinite; }
            @keyframes lj-wave { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(-9deg); } }
          }
        `}</style>
      ) : null}

      <ellipse cx="250" cy="437" rx="72" ry="7" fill={C.beige} />
      {/* rider's own legs: trousers and boots below the hobby-horse skirt */}
      <Poly p="218,350 242,350 240,416 220,416" f={C.navy} />
      <Poly p="218,350 226,350 226,416 220,416" f="#2E3A63" />
      <Poly p="256,350 280,350 278,416 258,416" f={C.navy} />
      <Poly p="272,350 280,350 278,416 272,416" f="#121830" />
      <Poly p="220,414 242,414 244,434 202,434 206,424" f={C.dark} />
      <Poly p="220,414 228,414 226,428 206,426" f={C.furLight} />
      <Poly p="256,414 278,414 294,424 296,434 254,434" f={C.dark} />
      <Poly p="256,414 264,414 264,434 254,434" f={C.furLight} />

      {/* rider robe (the hobby-horse frame hides it from the waist down) */}
      <Poly p="208,176 292,176 306,300 198,300" f={C.red} />
      <Poly p="208,176 248,176 244,300 198,300" f={C.redLight} />
      <Poly p="278,176 292,176 306,300 272,300" f={C.redShade} />
      {/* gold collar */}
      <Poly p="200,170 296,170 262,208 244,200" f={C.gold} />
      <Poly p="200,170 244,200 218,212" f={C.goldLight} />

      {/* horse neck + mane, rising from the front of the frame */}
      <Poly p="118,236 164,206 210,296 160,306" f={C.white} />
      <Poly p="164,206 210,296 188,300" f={C.grey} />
      <Poly p="156,202 172,196 214,292 202,296" f={C.dark} />
      {/* horse head in profile, facing left */}
      <Poly
        p="160,208 122,214 72,252 66,288 82,300 124,286 150,270"
        f={C.white}
      />
      <Poly p="160,208 122,214 72,252 96,258 150,234" f="#E4B87F" />
      <Poly p="66,288 82,300 124,286 150,270 140,260 96,280" f={C.grey} />
      <Poly p="72,252 66,288 78,290 84,256" f={C.greyDark} />
      <Poly p="146,212 156,180 170,208" f={C.white} />
      <Poly p="152,208 157,192 164,208" f={C.grey} />
      {/* nostril + eye */}
      <rect x="74" y="268" width="7" height="7" fill={C.dark} />
      <rect x="118" y="228" width="11" height="13" fill={C.navy} />
      <rect x="124" y="230" width="3" height="3" fill="#FFFFFF" />
      {/* bridle */}
      <Poly p="86,254 98,252 104,292 92,296" f={C.red} />
      <circle cx="96" cy="274" r="5.5" fill={C.gold} />

      {/* caparison skirt hanging from the rider's waist */}
      <Poly p="144,280 340,264 348,376 148,388" f={C.red} />
      <Poly p="144,280 230,273 234,383 148,388" f={C.redLight} />
      <Poly p="292,268 340,264 348,376 296,379" f={C.redShade} />
      <Poly p="148,364 348,352 348,376 148,388" f={C.redShade} />
      <polygon points="144,288 340,272 340,278 144,294" fill={C.gold} />
      {[166, 202, 238, 274, 310].map((x, i) => (
        <rect
          key={x}
          x={x}
          y={364.5 - i * 2.2}
          width="16"
          height="16"
          fill={i % 2 ? C.goldLight : C.gold}
        />
      ))}
      {/* gold fringe along the hem */}
      {[156, 179, 202, 225, 248, 271, 294, 317, 340].map((x) => {
        const y = 388 - (x - 148) * 0.06;
        return (
          <polygon
            key={x}
            points={`${x - 5},${y - 1} ${x + 5},${y - 1.6} ${x},${y + 9}`}
            fill={C.gold}
          />
        );
      })}
      {/* hobby-horse tail, flowing out behind the skirt */}
      <Poly
        p="338,270 360,262 384,288 390,340 376,356 368,314 346,292"
        f={C.dark}
      />
      <Poly p="338,270 360,262 380,286 364,298 346,292" f={C.furLight} />
      <Poly p="372,300 384,296 390,340 380,350" f={C.fur} />

      {/* other arm, hand resting on the hobby-horse frame */}
      <Poly p="282,186 302,180 324,262 302,268" f={C.red} />
      <Poly p="302,180 308,184 328,258 324,262" f={C.redShade} />
      <Poly p="298,262 324,256 330,276 304,282" f={C.orange} />
      <Poly p="318,257 324,256 330,276 322,278" f={C.orangeShade} />

      {/* waving arm */}
      <g className="lj-wave">
        <Poly p="196,198 224,186 196,124 172,136" f={C.red} />
        <Poly p="196,198 208,192 182,130 172,136" f={C.redLight} />
        <Poly p="164,100 190,96 196,128 170,134" f={C.orange} />
        <Poly p="164,100 176,98 172,133 170,134" f="#FAB95A" />
        <Poly p="183,97 190,96 196,128 187,130" f={C.orangeShade} />
      </g>
      <Spark x={122} y={92} r={0.9} />

      {/* head */}
      <LajkonikHeadShapes />
    </g>
  );
}
