"use client";

import {
  motion,
  useTransform,
  useMotionValueEvent,
  type MotionValue,
} from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import { rh27Assets } from "@/lib/rh27/assets";
import {
  FROG_JUMP_SEQUENCE,
  poseToBackgroundPosition,
  scrollProgressToPoseIndex,
  TURNAROUND_FRAME_COUNT,
  type FrogPose,
} from "@/lib/rh27/frogSprites";

type Rh27FrogProps = {
  scrollYProgress: MotionValue<number>;
  reducedMotion: boolean;
};

function FrogSprite({ pose }: { pose: FrogPose }) {
  if (pose.type === "turnaround") {
    return (
      <div
        className="w-full h-full bg-no-repeat"
        style={{
          backgroundImage: `url(${rh27Assets.frogTurnaround})`,
          backgroundSize: `${TURNAROUND_FRAME_COUNT * 100}% 100%`,
          backgroundPosition: poseToBackgroundPosition(pose.frame),
        }}
        role="img"
        aria-hidden
      />
    );
  }

  const scaleX = pose.scaleX ?? 1;
  const scaleY = pose.scaleY ?? 1;

  return (
    <Image
      src={rh27Assets.frogWaving}
      alt=""
      fill
      className="object-contain object-bottom"
      style={{
        transform: `scale(${scaleX}, ${scaleY})`,
        transformOrigin: "center bottom",
      }}
      sizes="180px"
      priority
    />
  );
}

export default function Rh27Frog({
  scrollYProgress,
  reducedMotion,
}: Rh27FrogProps) {
  const [poseIndex, setPoseIndex] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (reducedMotion) return;
    setPoseIndex(scrollProgressToPoseIndex(v));
  });

  // Frog starts center-right on its lily pad, jumps left on scroll
  const x = useTransform(
    scrollYProgress,
    [0, 1],
    reducedMotion ? ["62%", "48%"] : ["64%", "32%"],
  );
  const y = useTransform(scrollYProgress, [0, 0.45, 1], [0, -80, 0]);
  const rotate = useTransform(scrollYProgress, [0, 0.45, 1], [0, -6, 0]);

  const pose =
    FROG_JUMP_SEQUENCE[reducedMotion ? 0 : poseIndex] ?? FROG_JUMP_SEQUENCE[0];
  const showImpact =
    !reducedMotion && poseIndex === FROG_JUMP_SEQUENCE.length - 2;

  return (
    <motion.div
      className="absolute z-[50]"
      style={{
        left: x,
        top: "49%",
        y,
        rotate,
        width: "clamp(90px, 14vw, 180px)",
        height: "clamp(110px, 17vw, 220px)",
      }}
    >
      {showImpact && (
        <svg
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-20 h-7 rh27-impact-flash"
          viewBox="0 0 80 20"
          aria-hidden
        >
          <path
            d="M40 10 L10 10 M40 10 L70 10 M40 10 L40 3 M40 10 L18 17 M40 10 L62 17"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      )}
      <div
        key={poseIndex}
        className="relative w-full h-full drop-shadow-2xl"
        style={
          reducedMotion
            ? undefined
            : { transition: "transform 83ms cubic-bezier(0.16, 1, 0.3, 1)" }
        }
      >
        <FrogSprite pose={pose} />
      </div>
    </motion.div>
  );
}
