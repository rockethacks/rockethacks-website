"use client";

import { useEffect } from "react";
import { useMotionValue, useSpring, useReducedMotion } from "framer-motion";
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
  const reducedMotion = useReducedMotion() ?? false;

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const mouseX = useSpring(rawX, { damping: 30, stiffness: 90, mass: 0.6 });
  const mouseY = useSpring(rawY, { damping: 30, stiffness: 90, mass: 0.6 });

  useEffect(() => {
    if (reducedMotion) return;
    const onMove = (e: MouseEvent) => {
      rawX.set(e.clientX / window.innerWidth - 0.5);
      rawY.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [reducedMotion, rawX, rawY]);

  return (
    <div className={`rh27 ${josefin.variable}`}>
      <section
        aria-label="RocketHacks 2027"
        className="relative overflow-hidden"
        style={{ height: "100dvh" }}
      >
        {/* Background environment + lily pads + monstera */}
        <Rh27Environment
          mouseX={mouseX}
          mouseY={mouseY}
          reducedMotion={reducedMotion}
        />

        {/* Frog character */}
        <Rh27Frog
          mouseX={mouseX}
          mouseY={mouseY}
          reducedMotion={reducedMotion}
        />

        {/* Header — on top of environment */}
        <Rh27Header />

        {/* Hero copy — left-aligned, vertically centered */}
        <div
          className="absolute inset-0 z-[40] flex flex-col justify-center pointer-events-none"
          style={{
            paddingTop: "clamp(80px, 9vh, 120px)",
            paddingLeft: "clamp(24px, 5vw, 72px)",
            paddingRight: "clamp(24px, 5vw, 72px)",
            paddingBottom: "clamp(40px, 5vh, 80px)",
          }}
        >
          <div
            className="max-w-[min(100%, 52vw)]"
            style={{ minWidth: "min(100%, 300px)" }}
          >
            <Rh27HeroTitle />

            <p
              className="text-white"
              style={{
                fontFamily:
                  "var(--font-rh27-josefin), 'Josefin Sans', sans-serif",
                fontSize: "clamp(14px, 1.45vw, 22px)",
                fontWeight: 400,
                letterSpacing: "0.04em",
                marginTop: "clamp(14px, 2.2vh, 30px)",
                lineHeight: 1.3,
              }}
            >
              February 27–28, 2027
            </p>

            <p
              style={{
                fontFamily:
                  "var(--font-rh27-josefin), 'Josefin Sans', sans-serif",
                fontSize: "clamp(11px, 1.15vw, 17px)",
                fontWeight: 300,
                letterSpacing: "0.04em",
                marginTop: "clamp(4px, 0.6vh, 10px)",
                lineHeight: 1.3,
                color: "rgba(255,255,255,0.75)",
              }}
            >
              In Person Event | MLH Official Member
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
