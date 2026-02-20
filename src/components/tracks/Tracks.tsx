"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { terminal } from "../../app/fonts/fonts";

// Clean SVG vector icons — white, stroke-based
const HealthcareIcon = () => (
  <svg
    width="52"
    height="52"
    viewBox="0 0 52 52"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Cross / medical plus */}
    <rect
      x="21"
      y="6"
      width="10"
      height="40"
      rx="3"
      fill="white"
      fillOpacity="0.9"
    />
    <rect
      x="6"
      y="21"
      width="40"
      height="10"
      rx="3"
      fill="white"
      fillOpacity="0.9"
    />
    {/* Subtle circle outline */}
    <circle
      cx="26"
      cy="26"
      r="24"
      stroke="white"
      strokeOpacity="0.2"
      strokeWidth="1.5"
    />
  </svg>
);

const FinanceIcon = () => (
  <svg
    width="52"
    height="52"
    viewBox="0 0 52 52"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Bar chart */}
    <rect
      x="5"
      y="30"
      width="10"
      height="16"
      rx="2"
      fill="white"
      fillOpacity="0.9"
    />
    <rect
      x="21"
      y="18"
      width="10"
      height="28"
      rx="2"
      fill="white"
      fillOpacity="0.9"
    />
    <rect
      x="37"
      y="8"
      width="10"
      height="38"
      rx="2"
      fill="white"
      fillOpacity="0.9"
    />
    {/* Trend line */}
    <polyline
      points="10,28 26,16 42,6"
      stroke="white"
      strokeOpacity="0.5"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SustainabilityIcon = () => (
  <svg
    width="52"
    height="52"
    viewBox="0 0 52 52"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Leaf shape */}
    <path
      d="M26 46 C26 46 8 36 8 20 C8 10 16 6 26 6 C36 6 44 10 44 20 C44 36 26 46 26 46Z"
      fill="white"
      fillOpacity="0.15"
      stroke="white"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    {/* Stem */}
    <line
      x1="26"
      y1="46"
      x2="26"
      y2="28"
      stroke="white"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    {/* Vein */}
    <path
      d="M26 36 C20 30 14 28 10 26"
      stroke="white"
      strokeOpacity="0.5"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M26 30 C32 24 38 22 42 20"
      stroke="white"
      strokeOpacity="0.5"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const HardwareIcon = () => (
  <svg
    width="52"
    height="52"
    viewBox="0 0 52 52"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* CPU chip body */}
    <rect
      x="14"
      y="14"
      width="24"
      height="24"
      rx="3"
      fill="white"
      fillOpacity="0.15"
      stroke="white"
      strokeWidth="2"
    />
    {/* Inner core */}
    <rect
      x="20"
      y="20"
      width="12"
      height="12"
      rx="1.5"
      fill="white"
      fillOpacity="0.9"
    />
    {/* Pins — top */}
    <line
      x1="19"
      y1="14"
      x2="19"
      y2="8"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <line
      x1="26"
      y1="14"
      x2="26"
      y2="8"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <line
      x1="33"
      y1="14"
      x2="33"
      y2="8"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
    {/* Pins — bottom */}
    <line
      x1="19"
      y1="38"
      x2="19"
      y2="44"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <line
      x1="26"
      y1="38"
      x2="26"
      y2="44"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <line
      x1="33"
      y1="38"
      x2="33"
      y2="44"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
    {/* Pins — left */}
    <line
      x1="14"
      y1="19"
      x2="8"
      y2="19"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <line
      x1="14"
      y1="26"
      x2="8"
      y2="26"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <line
      x1="14"
      y1="33"
      x2="8"
      y2="33"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
    {/* Pins — right */}
    <line
      x1="38"
      y1="19"
      x2="44"
      y2="19"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <line
      x1="38"
      y1="26"
      x2="44"
      y2="26"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <line
      x1="38"
      y1="33"
      x2="44"
      y2="33"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const tracksData = [
  {
    id: 0,
    title: "Healthcare",
    description:
      "Innovate solutions for medical challenges and improve patient outcomes",
    accent: "#7f819e",
    Icon: HealthcareIcon,
    gradient: "from-blue-500/20 to-cyan-500/10",
  },
  {
    id: 1,
    title: "Finance",
    description:
      "Build fintech solutions that revolutionize financial services",
    accent: "#ffc65a",
    Icon: FinanceIcon,
    gradient: "from-yellow-500/20 to-orange-500/10",
  },
  {
    id: 2,
    title: "Sustainability",
    description: "Create applications that make the world more sustainable",
    accent: "#c32c9a",
    Icon: SustainabilityIcon,
    gradient: "from-green-500/20 to-emerald-500/10",
  },
  {
    id: 3,
    title: "Hardware",
    description: "Develop IoT and embedded systems that push boundaries",
    accent: "#f483f5",
    Icon: HardwareIcon,
    gradient: "from-pink-500/20 to-purple-500/10",
  },
];

const CARD_COUNT = tracksData.length;
const ANGLE_SLICE = 360 / CARD_COUNT;
// Radius: distance from center to card face
// For 4 cards, a good radius is roughly card_width / (2 * tan(PI/n))
// card width ~320px → 320 / (2 * tan(45°)) = 320 / 2 = 160 → use ~320 to give breathing room
const RADIUS = 340;

export default function Tracks() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isRotating, setIsRotating] = useState(false);

  const handleTrackClick = (index: number) => {
    if (isRotating || index === activeIndex) return;
    setIsRotating(true);
    setActiveIndex(index);
    setTimeout(() => setIsRotating(false), 800);
  };

  // Rotate the scene so the active card faces the viewer (negative rotation)
  const sceneRotation = -activeIndex * ANGLE_SLICE;

  return (
    <section
      id="tracks"
      className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden"
    >
      {/* Background gradient elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-900/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2
            className={`${terminal.className} text-4xl sm:text-5xl font-bold uppercase tracking-wider mb-4 gradient-text`}
          >
            Hackathon Tracks
          </h2>
          <p className="text-white/70 text-base sm:text-lg max-w-2xl mx-auto">
            Choose your path and innovate across four transformative domains
          </p>
        </motion.div>

        {/* 3D Carousel Outer — perspective lives here */}
        <div
          className="relative mx-auto mb-12"
          style={{
            width: "100%",
            height: "420px",
            perspective: "1200px",
            perspectiveOrigin: "50% 50%",
          }}
        >
          {/* Scene — this rotates to bring cards into view */}
          <motion.div
            animate={{ rotateY: sceneRotation }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: 0,
              height: 0,
              transformStyle: "preserve-3d",
              transformOrigin: "0 0",
            }}
          >
            {tracksData.map((track, index) => {
              const cardRotationY = index * ANGLE_SLICE;
              const isActive = index === activeIndex;

              return (
                <motion.div
                  key={track.id}
                  onClick={() => handleTrackClick(index)}
                  style={{
                    position: "absolute",
                    width: "280px",
                    height: "360px",
                    left: "-140px", // half of width to center
                    top: "-180px", // half of height to center
                    transformStyle: "preserve-3d",
                    transform: `rotateY(${cardRotationY}deg) translateZ(${RADIUS}px)`,
                    cursor: isActive ? "default" : "pointer",
                  }}
                >
                  <motion.div
                    animate={{
                      scale: isActive ? 1 : 0.88,
                      opacity: isActive ? 1 : 0.55,
                    }}
                    transition={{ duration: 0.5 }}
                    className={`w-full h-full rounded-3xl p-6 flex flex-col justify-between overflow-hidden relative bg-gradient-to-br ${track.gradient} backdrop-blur-lg border-2`}
                    style={{
                      borderColor: isActive
                        ? track.accent
                        : "rgba(255, 255, 255, 0.12)",
                      boxShadow: isActive
                        ? `0 0 40px ${track.accent}60, 0 0 80px ${track.accent}20`
                        : "0 8px 32px rgba(0,0,0,0.4)",
                      background: isActive
                        ? `linear-gradient(135deg, ${track.accent}15, rgba(0,0,0,0.6))`
                        : "rgba(15,15,30,0.7)",
                    }}
                  >
                    {/* Shimmer overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/8 via-transparent to-transparent pointer-events-none rounded-3xl" />

                    <div className="relative z-10 space-y-4">
                      {/* Icon */}
                      <motion.div
                        animate={
                          isActive
                            ? { scale: [1, 1.12, 1.12, 1] }
                            : { scale: 1 }
                        }
                        transition={{
                          duration: 1.2,
                          repeat: Infinity,
                          repeatDelay: 2,
                        }}
                        style={{ opacity: isActive ? 1 : 0.6 }}
                      >
                        <track.Icon />
                      </motion.div>

                      {/* Title */}
                      <h3
                        className={`${terminal.className} text-2xl sm:text-3xl font-bold uppercase tracking-wide`}
                        style={{
                          color: track.accent,
                          textShadow: isActive
                            ? `0 0 20px ${track.accent}70`
                            : "none",
                        }}
                      >
                        {track.title}
                      </h3>

                      {/* Description */}
                      <p className="text-white/70 text-sm leading-relaxed">
                        {track.description}
                      </p>
                    </div>

                    {/* Bottom hint */}
                    {!isActive && (
                      <div className="relative z-10 text-white/40 text-xs uppercase tracking-widest">
                        Click to select →
                      </div>
                    )}
                    {isActive && (
                      <motion.div
                        className="relative z-10 text-xs uppercase tracking-widest font-semibold"
                        style={{ color: track.accent }}
                        animate={{ y: [0, 3, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        ● Active Track
                      </motion.div>
                    )}
                  </motion.div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row justify-center items-center gap-6 sm:gap-8"
        >
          <div className="flex gap-3 flex-wrap justify-center px-4">
            {tracksData.map((track, index) => (
              <motion.button
                key={index}
                onClick={() => handleTrackClick(index)}
                disabled={isRotating}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 rounded-full uppercase text-xs sm:text-sm font-bold tracking-widest transition-all duration-300 disabled:opacity-50 border-2"
                style={{
                  backgroundColor:
                    index === activeIndex
                      ? track.accent
                      : "rgba(255,255,255,0.08)",
                  borderColor:
                    index === activeIndex
                      ? track.accent
                      : "rgba(255,255,255,0.15)",
                  color:
                    index === activeIndex ? "#000" : "rgba(255,255,255,0.7)",
                }}
              >
                {track.title}
              </motion.button>
            ))}
          </div>

          <div className="text-white/60 text-xs uppercase tracking-widest font-semibold whitespace-nowrap">
            <span style={{ color: "#ffc65a", fontWeight: "bold" }}>
              {activeIndex + 1}
            </span>{" "}
            / {tracksData.length}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
