export const TURNAROUND_FRAME_COUNT = 5;

export type FrogPose =
  | { type: "waving"; scaleX?: number; scaleY?: number }
  | { type: "turnaround"; frame: number };

/** Discrete jump keyframes mapped to scroll segments (Spider-Verse stepped holds). */
export const FROG_JUMP_SEQUENCE: FrogPose[] = [
  { type: "waving" },
  { type: "waving", scaleY: 0.82, scaleX: 1.08 },
  { type: "turnaround", frame: 1 },
  { type: "turnaround", frame: 2 },
  { type: "turnaround", frame: 3 },
  { type: "turnaround", frame: 2 },
  { type: "waving", scaleY: 1.12, scaleX: 0.92 },
  { type: "waving", scaleY: 0.88, scaleX: 1.05 },
  { type: "waving" },
];

export function poseToBackgroundPosition(frame: number): string {
  if (TURNAROUND_FRAME_COUNT <= 1) return "0% 0%";
  const pct = (frame / (TURNAROUND_FRAME_COUNT - 1)) * 100;
  return `${pct}% 0%`;
}

export function scrollProgressToPoseIndex(progress: number): number {
  const p = Math.max(0, Math.min(1, progress));
  if (p < 0.12) return 0;
  if (p > 0.88) return FROG_JUMP_SEQUENCE.length - 1;
  const jumpStart = 0.12;
  const jumpEnd = 0.88;
  const t = (p - jumpStart) / (jumpEnd - jumpStart);
  const idx = Math.floor(t * (FROG_JUMP_SEQUENCE.length - 2)) + 1;
  return Math.min(idx, FROG_JUMP_SEQUENCE.length - 2);
}
