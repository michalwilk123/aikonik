import {
  KrakowSkylineShapes,
  LajkonikShapes,
} from "@/app/_components/lajkonik";

// Landing hero: a waving paper-style Lajkonik in front of the Krakow skyline,
// with a floating chat card. Pure SVG; motion is CSS and only runs when the
// visitor has not asked for reduced motion.
const NAVY = "#1B2340";
const RED = "#C62832";
const GOLD = "#F2A81D";

const chips = ["Wnioski i dokumenty", "Pytania o przepisy"] as const;

export function HeroArt({
  className,
  title,
}: {
  className?: string;
  title: string;
}) {
  return (
    <svg
      viewBox="0 0 600 440"
      className={className}
      role="img"
      focusable="false"
    >
      <title>{title}</title>
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .hx-card { animation: hx-bob 5s ease-in-out infinite; }
          .hx-rider { animation: hx-bob 6s ease-in-out -2s infinite; }
          .hx-spark { transform-box: fill-box; transform-origin: center; animation: hx-twinkle 3s ease-in-out infinite; }
          .hx-spark-b { animation-delay: -1.2s; }
          .hx-spark-c { animation-delay: -2.1s; }
          @keyframes hx-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
          @keyframes hx-twinkle { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: .35; transform: scale(.7); } }
        }
      `}</style>
      <defs>
        <clipPath id="hx-clip">
          <rect width="600" height="440" rx="28" />
        </clipPath>
      </defs>

      <g clipPath="url(#hx-clip)">
        <rect width="600" height="440" fill="#F4EEE6" />
        <g transform="translate(50 186) scale(.85)">
          <KrakowSkylineShapes fill="#E6DCD0" />
        </g>
        <path
          d="M0 440 V392 C120 366 220 372 320 388 C430 404 520 372 600 366 V440 Z"
          fill="#EADFD3"
        />
      </g>

      {/* handwritten note */}
      <g transform="rotate(-4 90 70)">
        <text
          className="font-hand"
          fill="#8A7C6E"
          fontSize="27"
          fontWeight="600"
        >
          <tspan x="30" y="52">
            Dla Ciebie,
          </tspan>
          <tspan x="30" y="80">
            dla Małopolski,
          </tspan>
          <tspan x="30" y="108">
            na co dzień
          </tspan>
        </text>
        <path
          d="M30 122 C 80 112, 140 118, 190 110"
          fill="none"
          stroke="#8A7C6E"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>

      {/* chat card */}
      <g className="hx-card">
        <rect
          x="26"
          y="156"
          width="226"
          height="214"
          rx="22"
          fill="#fff"
          stroke="#EADFD3"
          strokeWidth="2"
        />
        <rect x="46" y="176" width="186" height="52" rx="16" fill="#F4EEE6" />
        <text
          className="font-sans"
          x="62"
          y="209"
          fontSize="17"
          fontWeight="800"
          fill={NAVY}
        >
          W czym mogę pomóc?
        </text>
        {chips.map((c, i) => (
          <g key={c}>
            <rect
              x="46"
              y={244 + i * 46}
              width="186"
              height="38"
              rx="12"
              fill="#FBF7F1"
              stroke="#EADFD3"
              strokeWidth="1.5"
            />
            <circle cx="66" cy={263 + i * 46} r="7" fill={RED} />
            <text
              className="font-sans"
              x="82"
              y={269 + i * 46}
              fontSize="14.5"
              fontWeight="700"
              fill={NAVY}
            >
              {c}
            </text>
          </g>
        ))}
        <rect x="46" y="336" width="140" height="22" rx="11" fill="#F4EEE6" />
        <circle cx="218" cy="347" r="13" fill={RED} />
        <path
          d="M212 347 H224 M219 342 L224 347 L219 352"
          fill="none"
          stroke="#fff"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* mascot */}
      <g className="hx-rider">
        <g transform="translate(300 46) scale(.84) translate(-58 4)">
          <LajkonikShapes waving />
        </g>
      </g>

      {/* gold sparks */}
      <g fill={GOLD}>
        <path
          className="hx-spark"
          d="M548 70 L554 86 L548 102 L542 86 Z"
          transform="rotate(25 548 86)"
        />
        <path
          className="hx-spark hx-spark-b"
          d="M262 126 L267 138 L262 150 L257 138 Z"
          transform="rotate(-30 262 138)"
        />
        <path
          className="hx-spark hx-spark-c"
          d="M574 190 L579 200 L574 210 L569 200 Z"
          transform="rotate(40 574 200)"
        />
      </g>
    </svg>
  );
}
