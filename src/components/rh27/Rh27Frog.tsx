"use client";

import Image from "next/image";
import type { MotionValue } from "framer-motion";
import Rh27ParallaxLayer from "./Rh27ParallaxLayer";
import { rh27Assets } from "@/lib/rh27/assets";

type Props = {
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
  reducedMotion: boolean;
};

export default function Rh27Frog({ mouseX, mouseY, reducedMotion }: Props) {
  return (
    <Rh27ParallaxLayer
      mouseX={mouseX}
      mouseY={mouseY}
      depth={0.3}
      className="absolute z-[50]"
      style={{
        left: "61%",
        top: "46%",
        width: "clamp(90px, 13vw, 190px)",
        height: "clamp(110px, 16vw, 240px)",
      }}
    >
      <div
        className={`relative w-full h-full drop-shadow-2xl ${reducedMotion ? "" : "rh27-lily-bob"}`}
        style={
          {
            "--rh27-pad-rot": "0deg",
            animationDuration: "3.8s",
          } as React.CSSProperties
        }
      >
        <Image
          src={rh27Assets.frogWaving}
          alt="RocketHacks mascot frog waving hello"
          fill
          className="object-contain object-bottom"
          sizes="200px"
          priority
        />
      </div>
    </Rh27ParallaxLayer>
  );
}
