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
  white: "#F7F3EE",
  grey: "#D9D3CB",
  greyDark: "#BDB6AD",
  dark: "#3A3A40",
  beige: "#E6DCD0",
} as const;

function Poly({ p, f }: { p: string; f: string }) {
  return <polygon points={p} fill={f} stroke={f} strokeWidth="0.6" />;
}

/** Rider head: plume, hat, band and orange square face. Local frame ~ x 190-300, y 0-160. */
function Head() {
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

/** Mascot shapes without an <svg> wrapper (native box: x 58-350, y -4-446), for composing scenes. */
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

      <ellipse cx="212" cy="436" rx="125" ry="9" fill={C.beige} />
      {/* back legs */}
      <Poly p="272,350 306,350 306,420 276,420" f={C.grey} />
      <Poly p="276,420 306,420 306,436 272,436" f={C.dark} />
      <Poly p="236,356 266,356 266,412 240,412" f={C.white} />
      <Poly p="240,412 266,412 268,428 236,428" f={C.dark} />
      {/* front legs */}
      <Poly p="196,356 226,356 226,414 200,414" f={C.grey} />
      <Poly p="200,414 226,414 230,430 194,430" f={C.dark} />
      <Poly p="152,356 192,356 188,418 150,418" f={C.white} />
      <Poly p="150,418 188,418 192,434 142,434" f={C.dark} />

      {/* horse neck + mane */}
      <Poly p="132,214 176,200 206,300 150,318" f={C.white} />
      <Poly p="176,200 206,300 186,306" f={C.grey} />
      <Poly p="164,176 188,184 214,296 190,300" f={C.dark} />
      <Poly p="164,176 188,184 176,214" f="#55555D" />
      {/* horse head */}
      <Poly p="74,238 116,214 160,226 116,256" f={C.white} />
      <Poly p="116,256 160,226 168,282 126,318" f={C.grey} />
      <Poly p="74,238 116,256 126,318 68,300" f={C.white} />
      <Poly p="68,300 126,318 128,330 70,314" f={C.greyDark} />
      <Poly p="132,208 146,178 160,214" f={C.white} />
      <Poly p="138,208 146,190 154,214" f={C.grey} />
      {/* nostril + eye */}
      <rect x="82" y="290" width="8" height="8" fill={C.dark} />
      <rect x="116" y="250" width="9" height="9" rx="1" fill={C.navy} />
      {/* bridle */}
      <Poly p="74,266 118,278 120,290 72,278" f={C.red} />
      <Poly p="110,238 124,236 134,300 120,304" f={C.red} />
      <circle cx="122" cy="283" r="6" fill={C.gold} />

      {/* caparison */}
      <Poly p="148,296 336,268 342,372 158,384" f={C.red} />
      <Poly p="148,296 232,284 238,380 158,384" f={C.redLight} />
      <Poly p="290,274 336,268 342,372 296,376" f={C.redShade} />
      <Poly p="158,360 342,348 342,372 158,384" f={C.redShade} />
      <polygon points="150,306 336,278 336,284 150,312" fill={C.gold} />
      {[172, 206, 240, 274, 308].map((x, i) => (
        <rect
          key={x}
          x={x}
          y={346 - i * 1.5}
          width="16"
          height="16"
          fill={i % 2 ? C.goldLight : C.gold}
        />
      ))}

      {/* rider robe */}
      <Poly p="208,176 292,176 306,300 198,300" f={C.red} />
      <Poly p="208,176 248,176 244,300 198,300" f={C.redLight} />
      <Poly p="278,176 292,176 306,300 272,300" f={C.redShade} />
      {/* gold collar and sash */}
      <Poly p="200,170 296,170 262,208 244,200" f={C.gold} />
      <Poly p="200,170 244,200 218,212" f={C.goldLight} />
      <Poly p="262,208 286,214 262,290 240,284" f={C.gold} />
      <Poly p="240,284 262,290 258,304 238,298" f={C.goldLight} />

      {/* forward arm resting */}
      <Poly p="278,196 306,206 286,252 254,244" f={C.red} />
      <Poly p="278,196 254,244 238,236 262,192" f={C.redLight} />
      <Poly p="224,230 256,236 252,268 222,262" f={C.orange} />
      <Poly p="240,232 256,236 252,268 240,262" f={C.orangeShade} />

      {/* waving arm */}
      <g className="lj-wave">
        <Poly p="210,184 236,204 190,140 166,154" f={C.red} />
        <Poly p="210,184 236,204 224,206 198,190" f={C.redShade} />
        <Poly p="166,154 190,140 178,118 156,130" f={C.redLight} />
        <Poly p="150,98 182,92 186,128 156,134" f={C.orange} />
        <Poly p="150,98 168,95 160,134 156,134" f="#FAB95A" />
        <Poly p="168,95 182,92 186,128 172,131" f={C.orangeShade} />
      </g>
      <Spark x={122} y={92} r={0.9} />
      <polygon points="124,126 150,118 150,122 126,132" fill={C.gold} />

      {/* head */}
      <Head />
    </g>
  );
}
