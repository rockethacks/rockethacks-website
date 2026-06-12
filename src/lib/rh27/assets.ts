const BASE = "/RH27/RH27_Elements";

export const rh27Assets = {
  water: `${BASE}/a_top_down_view_of_serene_pond_water._deep_blueish_water_with_subtle_ripples.png`,
  padCluster: `${BASE}/a_cluster_of_small_floating_pond_leaves_various_sizes_top_down_view._hand_drawn.png`,
  padLarge: `${BASE}/a_single_green_lily_pad_top_down_view_matching_the_hand_drawn_textured.png`,
  padSmall: `${BASE}/a_smaller_round_lily_pad_with_a_slight_notch_top_down_view._hand_drawn_textured.png`,
  monstera: `${BASE}/a_single_large_monstera_style_tropical_leaf_top_down_view_matching_the_deep.png`,
  frogWaving: `${BASE}/rh27_frog_waving.png`,
  frogTurnaround: `${BASE}/rh27_frog_turnaround.png`,
} as const;

/**
 * Lily pad placements calibrated against the mockup.
 * left/top are percentages of the sticky hero container.
 * depth 0 = slowest parallax, 1 = fastest.
 */
export type LilyPadPlacement = {
  src: string;
  left: string;
  top: string;
  width: string;
  rotation: number;
  depth: number;
  delay?: number;
};

export const lilyPadPlacements: LilyPadPlacement[] = [
  // Upper-right cluster — smaller pads, lighter parallax
  { src: rh27Assets.padSmall, left: "60%", top: "8%",  width: "8%",  rotation: -8,  depth: 0.28, delay: 0 },
  { src: rh27Assets.padSmall, left: "68%", top: "4%",  width: "7%",  rotation: 22,  depth: 0.3,  delay: 0.5 },
  { src: rh27Assets.padSmall, left: "74%", top: "12%", width: "9%",  rotation: -18, depth: 0.32, delay: 1.1 },
  { src: rh27Assets.padSmall, left: "80%", top: "6%",  width: "7%",  rotation: 12,  depth: 0.26, delay: 0.7 },
  { src: rh27Assets.padSmall, left: "86%", top: "14%", width: "8%",  rotation: -5,  depth: 0.3,  delay: 1.5 },
  { src: rh27Assets.padSmall, left: "63%", top: "19%", width: "7%",  rotation: 30,  depth: 0.35, delay: 0.3 },
  { src: rh27Assets.padSmall, left: "76%", top: "20%", width: "8%",  rotation: -22, depth: 0.33, delay: 0.9 },
  { src: rh27Assets.padSmall, left: "88%", top: "22%", width: "7%",  rotation: 18,  depth: 0.28, delay: 1.3 },

  // Mid-right — larger pads
  { src: rh27Assets.padLarge, left: "56%", top: "36%", width: "13%", rotation: -10, depth: 0.4,  delay: 0.2 },
  { src: rh27Assets.padLarge, left: "71%", top: "40%", width: "15%", rotation: 8,   depth: 0.45, delay: 0.6 },
  { src: rh27Assets.padLarge, left: "84%", top: "34%", width: "11%", rotation: -20, depth: 0.38, delay: 1.0 },

  // Frog's lily pad — large, center-right (frog overlaid separately)
  { src: rh27Assets.padLarge, left: "62%", top: "52%", width: "18%", rotation: 5,   depth: 0.5,  delay: 0 },
];
