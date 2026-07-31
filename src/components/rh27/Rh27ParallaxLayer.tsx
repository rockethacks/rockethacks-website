"use client";

import { motion, useTransform, type MotionValue } from "framer-motion";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
  /** 0 = static, higher = moves more with cursor */
  depth?: number;
  className?: string;
  style?: React.CSSProperties;
};

export default function Rh27ParallaxLayer({
  children,
  mouseX,
  mouseY,
  depth = 0.1,
  className = "",
  style,
}: Props) {
  const spread = depth * 70;
  const x = useTransform(mouseX, [-0.5, 0.5], [-spread, spread]);
  const y = useTransform(mouseY, [-0.5, 0.5], [-spread * 0.65, spread * 0.65]);

  return (
    <motion.div className={className} style={{ ...style, x, y }}>
      {children}
    </motion.div>
  );
}
