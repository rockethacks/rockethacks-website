"use client";

import { useRef } from "react";
import { useScroll, useReducedMotion } from "framer-motion";
import { Josefin_Sans } from "next/font/google";
import Rh27Header from "./Rh27Header";
import Rh27HeroTitle from "./Rh27HeroTitle";
import Rh27Environment from "./Rh27Environment";
import Rh27Frog from "./Rh27Frog";

const josefin = Josefin_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  display: "swap",
  variable: "--font-rh27-josefin",
});

export default function Rh27Landing() {
  const scrollRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion() ?? false;

  const { scrollYProgress } = useScroll({
    target: scrollRef,
    offset: ["start start", "end end"],
  });

  return (
    <div className={`rh27 min-h-screen ${josefin.variable}`}>
      <section
        ref={scrollRef}
        data-chapter="hero"
        className="relative"
        style={{ minHeight: reducedMotion ? "100dvh" : "120vh" }}
        aria-label="RocketHacks 2027"
      >
        <div className="sticky top-0 h-[100dvh] w-full overflow-hidden">
          {/* Background environment layers */}
          <Rh27Environment
            scrollYProgress={scrollYProgress}
            reducedMotion={reducedMotion}
          />

          {/* Frog character */}
          <Rh27Frog
            scrollYProgress={scrollYProgress}
            reducedMotion={reducedMotion}
          />

          {/* Header — rendered last so it sits above environment */}
          <Rh27Header />

          {/* Hero copy — left-aligned, ~45% width, vertically centered */}
          <div
            className="absolute inset-0 z-[40] flex flex-col justify-center"
            style={{
              paddingTop: "clamp(80px, 9vh, 120px)", // clear the header
              paddingLeft: "clamp(24px, 5vw, 72px)",
              paddingRight: "clamp(24px, 5vw, 72px)",
              paddingBottom: "clamp(40px, 5vh, 80px)",
            }}
          >
            <div
              className="max-w-[min(100%,52vw)]"
              style={{ minWidth: "min(100%, 340px)" }}
            >
              <Rh27HeroTitle />

              {/* Date — Josefin Sans, spaced tracking */}
              <p
                className="text-white"
                style={{
                  fontFamily: "var(--font-rh27-josefin), 'Josefin Sans', sans-serif",
                  fontSize: "clamp(14px, 1.45vw, 22px)",
                  fontWeight: 400,
                  letterSpacing: "0.04em",
                  marginTop: "clamp(14px, 2.2vh, 30px)",
                  lineHeight: 1.3,
                }}
              >
                February 27-28, 2027
              </p>

              {/* MLH line — same font, slightly smaller */}
              <p
                className="text-white/85"
                style={{
                  fontFamily: "var(--font-rh27-josefin), 'Josefin Sans', sans-serif",
                  fontSize: "clamp(12px, 1.2vw, 18px)",
                  fontWeight: 300,
                  letterSpacing: "0.04em",
                  marginTop: "clamp(4px, 0.6vh, 10px)",
                  lineHeight: 1.3,
                }}
              >
                In Person Event | MLH Official Member
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
