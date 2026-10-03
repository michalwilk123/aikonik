// Hand-authored "folded paper" Smok Wawelski: same flat light/base/shade facet
// style as the Lajkonik mascot, in Kraków brand colours plus dragon greens.
const C = {
  green: "#3E9A53",
  greenLight: "#5DB36A",
  greenShade: "#2E7D45",
  greenDark: "#22603A",
  gold: "#F2A81D",
  goldLight: "#F7C94B",
  goldShade: "#E0861A",
  red: "#C62832",
  redLight: "#DE3B44",
  redShade: "#A81F29",
  navy: "#1B2340",
  beige: "#E6DCD0",
} as const;

function Poly({ p, f }: { p: string; f: string }) {
  return <polygon points={p} fill={f} stroke={f} strokeWidth="0.6" />;
}

function Spark({ x, y, r = 1 }: { x: number; y: number; r?: number }) {
  return (
    <polygon
      points={`${x},${y - 14 * r} ${x + 5 * r},${y} ${x},${y + 14 * r} ${x - 5 * r},${y}`}
      fill={C.gold}
    />
  );
}

/** Bat wing, drawn for the right side; mirrored for the left via transform. */
function Wing({ fly }: { fly: boolean }) {
  return fly ? (
    <g>
      <Poly p="136,108 196,40 190,104 172,96 168,128" f={C.red} />
      <Poly p="136,108 196,40 164,92" f={C.redLight} />
      <Poly p="172,96 190,104 168,128" f={C.redShade} />
    </g>
  ) : (
    <g>
      <Poly p="132,96 170,58 172,112 150,104 148,132" f={C.red} />
      <Poly p="132,96 170,58 148,96" f={C.redLight} />
      <Poly p="150,104 172,112 148,132" f={C.redShade} />
    </g>
  );
}

/**
 * Smok Wawelski without an <svg> wrapper (native box: x 0-200, y 0-200), for composing scenes.
 * Poses: "sit" (default), "wave" (left arm raised, animated), "fly" (wings spread, no ground shadow).
 */
export function SmokShapes({
  pose = "sit",
}: {
  pose?: "sit" | "wave" | "fly";
}) {
  const fly = pose === "fly";
  return (
    <g>
      {pose === "wave" ? (
        <style>{`
          @media (prefers-reduced-motion: no-preference) {
            .sm-wave { transform-box: fill-box; transform-origin: 20% 90%; animation: sm-wave 2.2s ease-in-out infinite; }
            @keyframes sm-wave { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(-10deg); } }
          }
        `}</style>
      ) : null}

      {fly ? null : <ellipse cx="100" cy="190" rx="72" ry="7" fill={C.beige} />}

      {/* tail: blocky curl with gold tip */}
      <g transform={fly ? "translate(0,-6)" : undefined}>
        <Poly p="132,148 172,148 176,172 134,176" f={C.green} />
        <Poly p="132,148 172,148 170,156 134,160" f={C.greenLight} />
        <Poly p="156,166 176,172 134,176 140,170" f={C.greenShade} />
        <Poly p="158,118 184,118 186,164 160,168" f={C.green} />
        <Poly p="158,118 170,118 172,166 160,168" f={C.greenLight} />
        <Poly p="176,118 184,118 186,164 176,165" f={C.greenShade} />
        <Poly p="156,120 172,90 188,120" f={C.gold} />
        <Poly p="156,120 172,90 168,120" f={C.goldLight} />
      </g>

      {/* wings (behind body) */}
      <g transform={fly ? undefined : "translate(0,4)"}>
        <Wing fly={fly} />
        <g transform="translate(200,0) scale(-1,1)">
          <Wing fly={fly} />
        </g>
      </g>

      {/* feet */}
      {fly ? (
        <>
          <Poly p="62,164 92,164 94,180 58,180" f={C.greenShade} />
          <Poly p="108,164 138,164 142,180 106,180" f={C.greenDark} />
        </>
      ) : (
        <>
          <Poly p="52,166 94,166 98,186 46,186" f={C.green} />
          <Poly p="52,166 72,166 66,186 46,186" f={C.greenLight} />
          <Poly p="106,166 148,166 154,186 102,186" f={C.green} />
          <Poly p="130,166 148,166 154,186 120,186" f={C.greenShade} />
          <Poly p="46,180 98,180 98,186 46,186" f={C.greenDark} />
          <Poly p="102,180 154,180 154,186 102,186" f={C.greenDark} />
        </>
      )}

      {/* body */}
      <Poly p="60,98 140,98 148,174 52,174" f={C.green} />
      <Poly p="60,98 100,98 100,174 52,174" f={C.greenLight} />
      <Poly p="124,98 140,98 148,174 114,174" f={C.greenShade} />
      {/* belly plates */}
      <Poly p="76,108 124,108 128,168 72,168" f={C.gold} />
      <Poly p="76,108 100,108 100,168 72,168" f={C.goldLight} />
      <Poly p="112,108 124,108 128,168 108,168" f={C.goldShade} />
      <polygon points="74,128 126,128 126,133 74,133" fill={C.goldShade} />
      <polygon points="73,148 127,148 127,153 73,153" fill={C.goldShade} />

      {/* resting arm (right) */}
      <Poly p="132,112 150,116 152,146 134,148" f={C.green} />
      <Poly p="142,114 150,116 152,146 142,147" f={C.greenShade} />
      {/* left arm: resting or waving */}
      {pose === "wave" ? (
        <g className="sm-wave">
          <Poly p="50,112 68,108 40,64 24,72" f={C.green} />
          <Poly p="50,112 68,108 60,110 44,102" f={C.greenShade} />
          <Poly p="24,72 40,64 30,44 14,52" f={C.greenLight} />
          <Poly p="14,52 30,44 28,34 12,40" f={C.gold} />
        </g>
      ) : (
        <>
          <Poly p="50,116 68,112 66,148 48,146" f={C.green} />
          <Poly p="50,116 58,114 56,147 48,146" f={C.greenLight} />
        </>
      )}

      {/* crest spikes */}
      <Poly p="70,32 82,10 92,32" f={C.gold} />
      <Poly p="70,32 82,10 78,32" f={C.goldLight} />
      <Poly p="90,30 102,4 112,30" f={C.gold} />
      <Poly p="90,30 102,4 98,30" f={C.goldLight} />
      <Poly p="110,32 122,10 132,32" f={C.goldShade} />

      {/* head */}
      <Poly p="48,28 152,28 156,102 44,102" f={C.green} />
      <Poly p="48,28 100,28 100,102 44,102" f={C.greenLight} />
      <Poly p="124,28 152,28 156,102 108,102" f={C.greenShade} />
      <Poly p="48,28 80,28 46,60" f="#7BC986" />
      {/* snout */}
      <Poly p="72,66 128,66 132,102 68,102" f={C.greenLight} />
      <Poly p="108,66 128,66 132,102 104,102" f={C.green} />
      <rect x="84" y="76" width="7" height="9" fill={C.greenDark} />
      <rect x="109" y="76" width="7" height="9" fill={C.greenDark} />
      {/* cheeks */}
      <Poly p="48,70 66,70 66,88 48,88" f={C.redLight} />
      <Poly p="134,70 152,70 152,88 134,88" f={C.red} />
      {/* eyes */}
      <rect x="64" y="42" width="11" height="20" rx="1.5" fill={C.navy} />
      <rect x="125" y="42" width="11" height="20" rx="1.5" fill={C.navy} />
      <rect x="67" y="46" width="4" height="4" fill="#FFFFFF" />
      <rect x="128" y="46" width="4" height="4" fill="#FFFFFF" />

      <Spark x={26} y={104} r={0.55} />
    </g>
  );
}
