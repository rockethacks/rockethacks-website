"use client";

/**
 * RH27 wordmark — two stacked lines, TAN Meringue primary font.
 *
 * O in ROCKET: frog-head silhouette overlaid inside the letter counter.
 * A in HACKS:  rocket/arrow icon substituted for the A crossbar/counter.
 *
 * Overlay positions are expressed as percentages of the character em-square
 * so they track when font-size scales with the viewport.
 */

function FrogInO() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
    >
      <svg
        viewBox="0 0 60 55"
        className="w-[62%] h-[62%] mt-[4%]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Frog head body — dark fill matching the pond */}
        <ellipse cx="30" cy="36" rx="22" ry="17" fill="oklch(0.20 0.06 220)" />
        {/* Left eye bulge */}
        <circle cx="16" cy="20" r="9" fill="oklch(0.20 0.06 220)" />
        {/* Right eye bulge */}
        <circle cx="44" cy="20" r="9" fill="oklch(0.20 0.06 220)" />
        {/* Eye shines */}
        <circle cx="16" cy="20" r="5.5" fill="oklch(0.78 0.12 85)" />
        <circle cx="44" cy="20" r="5.5" fill="oklch(0.78 0.12 85)" />
        <circle cx="13" cy="17" r="2" fill="oklch(0.22 0.06 220)" />
        <circle cx="41" cy="17" r="2" fill="oklch(0.22 0.06 220)" />
      </svg>
    </span>
  );
}

function RocketA() {
  return (
    <svg
      viewBox="0 0 58 88"
      className="inline-block align-bottom"
      style={{ height: "1em", width: "0.66em" }}
      fill="white"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {/* Left leg of A */}
      <path d="M0 88 L22 0 L29 0 L8 88 Z" />
      {/* Right leg of A */}
      <path d="M58 88 L36 0 L29 0 L50 88 Z" />
      {/* Rocket body inside the A counter */}
      <path
        d="M29 6 
           C23 16 20 28 20 40 
           L22 56 L29 60 L36 56 L38 40 
           C38 28 35 16 29 6 Z"
        fill="oklch(0.20 0.06 220)"
      />
      {/* Rocket nose cone */}
      <path
        d="M29 2 C26 8 24 14 24 20 L34 20 C34 14 32 8 29 2 Z"
        fill="white"
      />
      {/* Left fin */}
      <path d="M20 48 L14 62 L22 56 Z" fill="oklch(0.20 0.06 220)" />
      {/* Right fin */}
      <path d="M38 48 L44 62 L36 56 Z" fill="oklch(0.20 0.06 220)" />
      {/* Exhaust flame */}
      <ellipse cx="29" cy="64" rx="5" ry="8" fill="oklch(0.78 0.12 85)" opacity="0.9" />
    </svg>
  );
}

export default function Rh27HeroTitle() {
  const displayStyle: React.CSSProperties = {
    fontFamily: "'TAN Meringue', 'Georgia', 'Times New Roman', serif",
    fontWeight: 700,
    lineHeight: 0.92,
    color: "#ffffff",
    letterSpacing: "0.01em",
  };

  const lineStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "flex-end",
    whiteSpace: "nowrap",
  };

  return (
    <h1
      className="select-none"
      style={{
        ...displayStyle,
        fontSize: "clamp(60px, 11.5vw, 172px)",
      }}
      aria-label="RocketHacks"
    >
      {/* ── Line 1: ROCKET ── */}
      <span style={lineStyle}>
        <span>R</span>
        {/* O with frog peeking inside */}
        <span className="relative inline-block" style={{ isolation: "isolate" }}>
          O
          <FrogInO />
        </span>
        <span>CKET</span>
      </span>

      {/* ── Line 2: HACKS ── */}
      <span style={{ ...lineStyle, display: "flex" }}>
        <span>H</span>
        <RocketA />
        <span>CKS</span>
      </span>
    </h1>
  );
}
