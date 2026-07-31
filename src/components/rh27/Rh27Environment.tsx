"use client";

import Image from "next/image";
import type { MotionValue } from "framer-motion";
import Rh27ParallaxLayer from "./Rh27ParallaxLayer";
import { rh27Assets, lilyPadPlacements } from "@/lib/rh27/assets";

type Props = {
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
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

export default function Rh27Environment({ mouseX, mouseY, reducedMotion }: Props) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">

      {/* ── Layer 0: Water background (flipped horizontally) ── */}
      <Rh27ParallaxLayer
        mouseX={mouseX}
        mouseY={mouseY}
        depth={0.04}
        className="absolute z-0"
        style={{ inset: "-3%" }}
      >
        <div className="absolute inset-0" style={{ transform: "scaleX(-1)" }}>
          <Image
            src={rh27Assets.water}
            alt=""
            fill
            priority
            className="object-cover object-center"
            sizes="110vw"
          />
        </div>
        {/* Gradient darkens the left side where text lives */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(108deg, oklch(0.13 0.05 228 / 0.97) 0%, oklch(0.17 0.05 222 / 0.82) 32%, oklch(0.14 0.04 220 / 0.35) 55%, transparent 72%)",
          }}
        />
        {/* Subtle vignette around all edges */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 110% 100% at 55% 50%, transparent 50%, oklch(0.10 0.04 225 / 0.55) 100%)",
          }}
        />
      </Rh27ParallaxLayer>

      {/* ── Layer 1: Flowing ribbon swirls ── */}
      <Rh27ParallaxLayer
        mouseX={mouseX}
        mouseY={mouseY}
        depth={0.07}
        className={`absolute inset-0 z-[5] ${reducedMotion ? "" : "rh27-ribbon-drift"}`}
      >
        <PondRibbons />
      </Rh27ParallaxLayer>

      {/* ── Layer 2: Scattered lily pads ── */}
      {lilyPadPlacements.map((pad, i) => (
        <Rh27ParallaxLayer
          key={`pad-${i}`}
          mouseX={mouseX}
          mouseY={mouseY}
          depth={0.1 + pad.depth * 0.2}
          className="absolute z-[25]"
          style={{ left: pad.left, top: pad.top, width: pad.width }}
        >
          <div
            className={`relative w-full aspect-square ${reducedMotion ? "" : "rh27-lily-bob"}`}
            style={
              {
                "--rh27-pad-rot": `${pad.rotation}deg`,
                animationDelay: `${pad.delay ?? 0}s`,
                transform: `rotate(${pad.rotation}deg)`,
              } as React.CSSProperties
            }
          >
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

      {/* ── Layer 3: Monstera — bottom-left ── */}
      <Rh27ParallaxLayer
        mouseX={mouseX}
        mouseY={mouseY}
        depth={0.22}
        className="absolute z-[60]"
        style={{ left: "-4%", bottom: "-6%", width: "clamp(200px, 32vw, 500px)" }}
      >
        <div
          className="relative w-full"
          style={{ aspectRatio: "1 / 1", transform: "rotate(-15deg)" }}
        >
          <Image
            src={rh27Assets.monstera}
            alt=""
            fill
            className="object-contain"
            sizes="40vw"
          />
        </div>
      </Rh27ParallaxLayer>

      {/* ── Layer 4: Monstera — bottom-right (mirrored) ── */}
      <Rh27ParallaxLayer
        mouseX={mouseX}
        mouseY={mouseY}
        depth={0.28}
        className="absolute z-[60]"
        style={{ right: "-3%", bottom: "-4%", width: "clamp(200px, 34vw, 540px)" }}
      >
        <div
          className="relative w-full"
          style={{ aspectRatio: "1 / 1", transform: "rotate(8deg) scaleX(-1)" }}
        >
          <Image
            src={rh27Assets.monstera}
            alt=""
            fill
            className="object-contain"
            sizes="45vw"
          />
        </div>
      </Rh27ParallaxLayer>

    </div>
  );
}
