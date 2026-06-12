"use client";

import { motion, useTransform, type MotionValue } from "framer-motion";
import type { ReactNode } from "react";

type Rh27ParallaxLayerProps = {
  children: ReactNode;
  scrollYProgress: MotionValue<number>;
  /** Multiplier for vertical shift (negative = slower / farther). */
  yRange?: [number, number];
  xRange?: [number, number];
  className?: string;
  style?: React.CSSProperties;
};

export default function Rh27ParallaxLayer({
  children,
  scrollYProgress,
  yRange = [0, -80],
  xRange = [0, 0],
  className = "",
  style,
}: Rh27ParallaxLayerProps) {
  const y = useTransform(scrollYProgress, [0, 1], yRange);
  const x = useTransform(scrollYProgress, [0, 1], xRange);

  return (
    <motion.div className={className} style={{ ...style, x, y }}>
      {children}
    </motion.div>
  );
}
