"use client";

import Image from "next/image";
import type { MotionValue } from "framer-motion";
import Rh27ParallaxLayer from "./Rh27ParallaxLayer";
import { rh27Assets, lilyPadPlacements } from "@/lib/rh27/assets";

type Rh27EnvironmentProps = {
  scrollYProgress: MotionValue<number>;
  reducedMotion: boolean;
};

function PondRibbons() {
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <path
        d="M-80 380 Q180 180 460 320 T880 260 T1380 400"
        fill="none"
        stroke="oklch(0.42 0.1 190)"
        strokeWidth="55"
        opacity="0.3"
      />
      <path
        d="M-40 580 Q260 460 560 590 T1060 510 T1480 680"
        fill="none"
        stroke="oklch(0.35 0.08 200)"
        strokeWidth="40"
        opacity="0.22"
      />
      <path
        d="M160 80 Q420 240 740 120 T1280 60"
        fill="none"
        stroke="oklch(0.38 0.09 205)"
        strokeWidth="32"
        opacity="0.18"
      />
      <path
        d="M-60 700 Q300 650 700 750 T1400 700"
        fill="none"
        stroke="oklch(0.32 0.07 215)"
        strokeWidth="28"
        opacity="0.15"
      />
    </svg>
  );
}

export default function Rh27Environment({
  scrollYProgress,
  reducedMotion,
}: Rh27EnvironmentProps) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">

      {/* ── Layer 0: Water background (horizontally flipped for better quality) ── */}
      <Rh27ParallaxLayer
        scrollYProgress={scrollYProgress}
        yRange={[0, -25]}
        className="absolute inset-0 z-0"
      >
        <div className="absolute inset-0" style={{ transform: "scaleX(-1)" }}>
          <Image
            src={rh27Assets.water}
            alt=""
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
        </div>
        {/* Dark overlay — heavier on the left where copy lives */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(105deg, oklch(0.14 0.05 228) 0%, oklch(0.18 0.05 222) 38%, transparent 60%)",
          }}
        />
      </Rh27ParallaxLayer>

      {/* ── Layer 1: Flowing ribbon swirls ── */}
      <Rh27ParallaxLayer
        scrollYProgress={scrollYProgress}
        yRange={[0, -45]}
        className={`absolute inset-0 z-[5] ${reducedMotion ? "" : "rh27-ribbon-drift"}`}
      >
        <PondRibbons />
      </Rh27ParallaxLayer>

      {/* ── Layer 2: Scattered lily pads (upper-right → center-right) ── */}
      {lilyPadPlacements.map((pad, i) => (
        <Rh27ParallaxLayer
          key={`pad-${i}`}
          scrollYProgress={scrollYProgress}
          yRange={[0, -35 - pad.depth * 55]}
          xRange={[0, pad.depth * 18]}
          className={`absolute z-[25] ${reducedMotion ? "" : "rh27-lily-bob"}`}
          style={
            {
              left: pad.left,
              top: pad.top,
              width: pad.width,
              transform: `rotate(${pad.rotation}deg)`,
              animationDelay: `${pad.delay ?? 0}s`,
            } as React.CSSProperties
          }
        >
          <div className="relative w-full aspect-square">
            <Image
              src={pad.src}
              alt=""
              fill
              className="object-contain drop-shadow-lg"
              sizes="120px"
            />
          </div>
        </Rh27ParallaxLayer>
      ))}

      {/* ── Layer 3: Monstera — bottom-left corner ── */}
      <Rh27ParallaxLayer
        scrollYProgress={scrollYProgress}
        yRange={[0, -100]}
        className="absolute z-[60]"
        style={{
          left: "-4%",
          bottom: "-6%",
          width: "clamp(220px, 34vw, 520px)",
        }}
      >
        <div
          className="relative w-full"
          style={{ aspectRatio: "1 / 1", transform: "rotate(-15deg)" }}
        >
          <Image
            src={rh27Assets.monstera}
            alt=""
            fill
            className="object-contain object-bottom-left"
            sizes="40vw"
          />
        </div>
      </Rh27ParallaxLayer>

      {/* ── Layer 4: Monstera — bottom-right corner ── */}
      <Rh27ParallaxLayer
        scrollYProgress={scrollYProgress}
        yRange={[0, -115]}
        xRange={[0, 20]}
        className="absolute z-[60]"
        style={{
          right: "-3%",
          bottom: "-4%",
          width: "clamp(220px, 36vw, 560px)",
        }}
      >
        <div
          className="relative w-full"
          style={{ aspectRatio: "1 / 1", transform: "rotate(8deg) scaleX(-1)" }}
        >
          <Image
            src={rh27Assets.monstera}
            alt=""
            fill
            className="object-contain object-bottom-right"
            sizes="45vw"
          />
        </div>
      </Rh27ParallaxLayer>

    </div>
  );
}
