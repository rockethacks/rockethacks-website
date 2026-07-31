"use client";

export default function Rh27HeroTitle() {
  return (
    <h1
      className="select-none text-white"
      aria-label="RocketHacks"
      style={{
        fontFamily: "var(--font-rh27-josefin), 'Josefin Sans', sans-serif",
        fontWeight: 600,
        fontSize: "clamp(56px, 11vw, 168px)",
        lineHeight: 0.9,
        letterSpacing: "0.02em",
        textTransform: "uppercase",
      }}
    >
      <span className="block">Rocket</span>
      <span className="block">Hacks</span>
    </h1>
  );
}
