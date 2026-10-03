// Flat, friendly illustrations. Palette: navy #1B2340, Kraków red #C62832,
// pastel red #FBE3E1, gold #F2A81D, beige #F4EEE6 / #EADFD3, skin tones.
type Props = {
  className?: string;
  title?: string;
  // Only used when nesting one illustration inside another.
  box?: { x: number; y: number; width: number; height: number };
};

function Svg({
  className,
  title,
  box,
  viewBox,
  children,
}: Props & { viewBox: string; children: React.ReactNode }) {
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: title is optional; without it the SVG is aria-hidden (decorative)
    <svg
      viewBox={viewBox}
      {...box}
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

const NAVY = "#1B2340";
const TEAL = "#C62832";
const MINT = "#FBE3E1";
const YELLOW = "#F2A81D";

// Town hall of a Małopolska town: clock tower, steps, flag.
export function TownHallIllustration({ className, title, box }: Props) {
  return (
    <Svg className={className} title={title} box={box} viewBox="0 0 240 200">
      <ellipse cx="120" cy="188" rx="110" ry="8" fill="#EADFD3" />
      <rect
        x="100"
        y="20"
        width="40"
        height="70"
        fill="#F4EEE6"
        stroke={NAVY}
        strokeWidth="3"
      />
      <polygon
        points="96,22 120,2 144,22"
        fill={TEAL}
        stroke={NAVY}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <circle
        cx="120"
        cy="46"
        r="12"
        fill="#fff"
        stroke={NAVY}
        strokeWidth="3"
      />
      <path
        d="M120 38v8l6 4"
        stroke={NAVY}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <rect
        x="108"
        y="66"
        width="24"
        height="24"
        rx="12"
        fill={MINT}
        stroke={NAVY}
        strokeWidth="3"
      />
      <rect
        x="30"
        y="90"
        width="180"
        height="88"
        fill="#fff"
        stroke={NAVY}
        strokeWidth="3"
      />
      <rect
        x="22"
        y="82"
        width="196"
        height="14"
        fill={TEAL}
        stroke={NAVY}
        strokeWidth="3"
      />
      {[48, 80, 144, 176].map((x) => (
        <rect
          key={x}
          x={x - 9}
          y="110"
          width="18"
          height="30"
          rx="9"
          fill={MINT}
          stroke={NAVY}
          strokeWidth="3"
        />
      ))}
      <rect
        x="104"
        y="128"
        width="32"
        height="50"
        rx="16"
        fill={YELLOW}
        stroke={NAVY}
        strokeWidth="3"
      />
      <rect
        x="16"
        y="178"
        width="208"
        height="10"
        fill="#E6DCD0"
        stroke={NAVY}
        strokeWidth="3"
      />
      <path d="M200 82V40" stroke={NAVY} strokeWidth="3" />
      <path
        d="M200 40h22v14h-22z"
        fill={YELLOW}
        stroke={NAVY}
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Senior with a cane.
export function SeniorIllustration({ className, title, box }: Props) {
  return (
    <Svg className={className} title={title} box={box} viewBox="0 0 120 200">
      <ellipse cx="60" cy="190" rx="44" ry="6" fill="#EADFD3" />
      <path
        d="M44 150v34M68 150v34"
        stroke={NAVY}
        strokeWidth="9"
        strokeLinecap="round"
      />
      <path
        d="M38 188h14M62 188h14"
        stroke={NAVY}
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M34 156c-4-30 0-62 8-76h36c8 14 10 40 6 76z"
        fill={TEAL}
        stroke={NAVY}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M78 92c14 10 20 24 22 40"
        stroke={NAVY}
        strokeWidth="9"
        strokeLinecap="round"
        fill="none"
      />
      <circle
        cx="100"
        cy="136"
        r="6"
        fill="#f1c7a0"
        stroke={NAVY}
        strokeWidth="3"
      />
      <path
        d="M102 140v46"
        stroke="#8d5a3b"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M102 140c0-8 10-8 10 0"
        stroke="#8d5a3b"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      <circle
        cx="60"
        cy="56"
        r="24"
        fill="#f1c7a0"
        stroke={NAVY}
        strokeWidth="3"
      />
      <path
        d="M36 52c0-22 12-30 24-30s24 8 24 30c-6-10-12-14-24-14s-18 4-24 14z"
        fill="#EADFD3"
        stroke={NAVY}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <circle cx="51" cy="60" r="2.5" fill={NAVY} />
      <circle cx="69" cy="60" r="2.5" fill={NAVY} />
      <path
        d="M52 70q8 7 16 0"
        stroke={NAVY}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="51" cy="60" r="7" fill="none" stroke={NAVY} strokeWidth="2" />
      <circle cx="69" cy="60" r="7" fill="none" stroke={NAVY} strokeWidth="2" />
      <path d="M58 60h4" stroke={NAVY} strokeWidth="2" />
    </Svg>
  );
}

// Parent holding a child's hand.
export function ParentChildIllustration({ className, title, box }: Props) {
  return (
    <Svg className={className} title={title} box={box} viewBox="0 0 160 200">
      <ellipse cx="80" cy="190" rx="66" ry="6" fill="#EADFD3" />
      {/* parent */}
      <path
        d="M38 150v34M62 150v34"
        stroke={NAVY}
        strokeWidth="9"
        strokeLinecap="round"
      />
      <path
        d="M26 154c-2-32 4-60 12-72h36c8 12 12 40 10 72z"
        fill={NAVY}
        stroke={NAVY}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M50 84l8 18 8-18"
        fill="#fff"
        stroke={NAVY}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M76 94c10 14 20 28 30 34"
        stroke={NAVY}
        strokeWidth="9"
        strokeLinecap="round"
        fill="none"
      />
      <circle
        cx="108"
        cy="130"
        r="6"
        fill="#c98e63"
        stroke={NAVY}
        strokeWidth="3"
      />
      <circle
        cx="56"
        cy="56"
        r="22"
        fill="#c98e63"
        stroke={NAVY}
        strokeWidth="3"
      />
      <path
        d="M33 56c-2-24 10-36 24-36s26 12 22 34c-4-8-10-14-22-14s-18 6-24 16z"
        fill="#3b2a20"
        stroke={NAVY}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <circle cx="49" cy="60" r="2.5" fill={NAVY} />
      <circle cx="63" cy="60" r="2.5" fill={NAVY} />
      <path
        d="M49 69q7 6 14 0"
        stroke={NAVY}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      {/* child */}
      <path
        d="M116 160v26M132 160v26"
        stroke={NAVY}
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d="M106 164c0-20 2-32 8-40h22c6 8 8 20 8 40z"
        fill={YELLOW}
        stroke={NAVY}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M114 128l-6 2"
        stroke={NAVY}
        strokeWidth="7"
        strokeLinecap="round"
      />
      <circle
        cx="126"
        cy="104"
        r="16"
        fill="#f1c7a0"
        stroke={NAVY}
        strokeWidth="3"
      />
      <path
        d="M110 100c0-14 8-20 16-20s18 6 16 20c-6-6-10-8-16-8s-10 2-16 8z"
        fill="#8d5a3b"
        stroke={NAVY}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <circle cx="120" cy="107" r="2" fill={NAVY} />
      <circle cx="131" cy="107" r="2" fill={NAVY} />
      <path
        d="M120 113q5 4 10 0"
        stroke={NAVY}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

// Volunteer in a vest carrying a shopping bag.
export function VolunteerIllustration({ className, title, box }: Props) {
  return (
    <Svg className={className} title={title} box={box} viewBox="0 0 140 200">
      <ellipse cx="70" cy="190" rx="52" ry="6" fill="#EADFD3" />
      <path
        d="M52 152v32M76 152v32"
        stroke="#5B6075"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <path
        d="M44 186h16M68 186h16"
        stroke={NAVY}
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M40 156c-2-30 2-58 10-72h40c8 14 12 42 10 72z"
        fill="#fff"
        stroke={NAVY}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M50 84l12 70H44c-2-30 0-56 6-70zM90 84l-12 70h18c2-30-2-56-6-70z"
        fill={YELLOW}
        stroke={NAVY}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M44 96c-10 14-14 28-12 44"
        stroke={NAVY}
        strokeWidth="9"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M96 96c10 12 16 24 16 38"
        stroke={NAVY}
        strokeWidth="9"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M100 138h26l-4 34h-18z"
        fill={MINT}
        stroke={NAVY}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M106 138c0-12 14-12 14 0"
        stroke={NAVY}
        strokeWidth="3"
        fill="none"
      />
      <circle
        cx="70"
        cy="58"
        r="22"
        fill="#f1c7a0"
        stroke={NAVY}
        strokeWidth="3"
      />
      <path
        d="M48 56c0-20 10-30 22-30s22 8 22 28c-4-8-12-12-22-12s-18 4-22 14z"
        fill="#b5642c"
        stroke={NAVY}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <circle cx="62" cy="62" r="2.5" fill={NAVY} />
      <circle cx="78" cy="62" r="2.5" fill={NAVY} />
      <path
        d="M62 71q8 7 16 0"
        stroke={NAVY}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

// Two speech bubbles: a question and an answer.
export function SpeechBubblesIllustration({ className, title, box }: Props) {
  return (
    <Svg className={className} title={title} box={box} viewBox="0 0 160 120">
      <path
        d="M12 12h92a10 10 0 0 1 10 10v38a10 10 0 0 1-10 10H46l-18 16V70H12A10 10 0 0 1 2 60V22A10 10 0 0 1 12 12z"
        fill="#fff"
        stroke={NAVY}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M18 32h72M18 46h50"
        stroke={NAVY}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M58 52h92a10 10 0 0 1 10 10v30a10 10 0 0 1-10 10h-10v16l-18-16H58a10 10 0 0 1-10-10V62a10 10 0 0 1 10-10z"
        fill={MINT}
        stroke={NAVY}
        strokeWidth="3"
        strokeLinejoin="round"
        transform="translate(-4 -2)"
      />
      <path
        d="M66 72h70M66 86h44"
        stroke={NAVY}
        strokeWidth="4"
        strokeLinecap="round"
      />
    </Svg>
  );
}

// Linked circles: a need meeting a solution (matches the brand mark).
export function LinkedCirclesIllustration({ className, title, box }: Props) {
  return (
    <Svg className={className} title={title} box={box} viewBox="0 0 160 100">
      <circle
        cx="56"
        cy="50"
        r="34"
        fill={MINT}
        stroke={NAVY}
        strokeWidth="3"
      />
      <circle
        cx="104"
        cy="50"
        r="34"
        fill="none"
        stroke={NAVY}
        strokeWidth="3"
      />
      <circle
        cx="104"
        cy="50"
        r="30"
        fill="none"
        stroke={TEAL}
        strokeWidth="5"
      />
      <path
        d="M44 50h24M60 40l10 10-10 10"
        stroke={NAVY}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle
        cx="132"
        cy="16"
        r="8"
        fill={YELLOW}
        stroke={NAVY}
        strokeWidth="3"
      />
    </Svg>
  );
}

// Step icons: pencil on paper, magnifier, phone.
export function StepWriteIllustration({ className, title, box }: Props) {
  return (
    <Svg className={className} title={title} box={box} viewBox="0 0 96 96">
      <circle cx="48" cy="48" r="46" fill="#F4EEE6" />
      <rect
        x="24"
        y="20"
        width="42"
        height="54"
        rx="5"
        fill="#fff"
        stroke={NAVY}
        strokeWidth="3"
      />
      <path
        d="M32 34h26M32 44h26M32 54h14"
        stroke={NAVY}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M52 76l4-14 22-22 10 10-22 22z"
        fill={YELLOW}
        stroke={NAVY}
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function StepSearchIllustration({ className, title, box }: Props) {
  return (
    <Svg className={className} title={title} box={box} viewBox="0 0 96 96">
      <circle cx="48" cy="48" r="46" fill="#F4EEE6" />
      <circle
        cx="42"
        cy="42"
        r="20"
        fill={MINT}
        stroke={NAVY}
        strokeWidth="3"
      />
      <path
        d="M57 57l20 20"
        stroke={NAVY}
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M33 42h18M42 33v18"
        stroke={NAVY}
        strokeWidth="4"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function StepContactIllustration({ className, title, box }: Props) {
  return (
    <Svg className={className} title={title} box={box} viewBox="0 0 96 96">
      <circle cx="48" cy="48" r="46" fill="#F4EEE6" />
      <rect
        x="30"
        y="14"
        width="36"
        height="68"
        rx="7"
        fill="#fff"
        stroke={NAVY}
        strokeWidth="3"
      />
      <path d="M44 22h8" stroke={NAVY} strokeWidth="3" strokeLinecap="round" />
      <rect
        x="36"
        y="32"
        width="24"
        height="12"
        rx="4"
        fill={MINT}
        stroke={NAVY}
        strokeWidth="2.5"
      />
      <rect
        x="36"
        y="48"
        width="24"
        height="12"
        rx="4"
        fill={YELLOW}
        stroke={NAVY}
        strokeWidth="2.5"
      />
      <circle cx="48" cy="72" r="3.5" fill={NAVY} />
    </Svg>
  );
}
