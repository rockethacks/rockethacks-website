# RocketHacks 27 Design Language

Source of truth for the RH27 pond hero and future scroll chapters.

## Scene

Night pond at the engineering building, viewed from above: teal water currents, halftone lily pads, monstera framing the edges, one mascot frog hopping through comic-book motion.

## Color strategy

Drenched teal/navy body with lime-green organic accents. Do not use RH26 yellow/navy space palette on `/`.

| Token | CSS variable | Role |
|-------|--------------|------|
| Ink | `--rh27-ink` | Headlines, icons (`#ffffff`) |
| Pond deep | `--rh27-pond-deep` | Background base `oklch(0.22 0.06 220)` |
| Pond mid | `--rh27-pond-mid` | Ribbons, swirls `oklch(0.35 0.08 195)` |
| Pond glow | `--rh27-pond-glow` | Highlights `oklch(0.42 0.1 190)` |
| Lily | `--rh27-lily` | Lily pads `oklch(0.55 0.14 145)` |
| Lily dark | `--rh27-lily-dark` | Pad veins `oklch(0.38 0.12 150)` |
| Frog gold | `--rh27-frog-gold` | Eye accent `oklch(0.78 0.12 85)` |

Halftone: `radial-gradient` dot pattern at 4% opacity on pads and monstera (`--rh27-halftone`).

## Typography

- **Display:** Custom SVG wordmark `Rh27HeroTitle` (frog in O, rocket in A).
- **UI:** Outfit (`--font-rh27-ui`) for dates and MLH line.
- **Elsewhere:** Existing Terminal Grotesque / Plus Jakarta on `/2026/` and app routes.

## Motion (Spider-Verse / 12 fps)

- Frame duration: `83ms` (`--rh27-frame-ms`).
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)` (expo-out). No bounce.
- Sprite playback: CSS `steps(1)` between discrete keyframes.
- Reduced motion: static layout, frog at rest position, no parallax transforms.

## Z-index scale

| Layer | z-index |
|-------|---------|
| Water / ribbons | 0–10 |
| Distant lily pads | 20 |
| Mid lily pads | 30 |
| Hero copy | 40 |
| Frog | 50 |
| Foreground monstera | 60 |
| Header | 70 |

## Assets (`/RH27/RH27_Elements/`)

| File | Use |
|------|-----|
| `a_top_down_view_of_serene_pond_water...png` | LCP background |
| `a_cluster_of_small_floating_pond_leaves...png` | Pad cluster |
| `a_single_green_lily_pad...png` | Scattered pads |
| `a_smaller_round_lily_pad...png` | Scattered pads |
| `a_single_large_monstera...png` | Foreground L/R |
| `rh27_frog_waving.png` | Idle, wave, jump squash/stretch |
| `rh27_frog_turnaround.png` | 5-frame horizontal strip (profile hop) |
| `RocketHacks-Logo26.png` | Header mark (white) |

## Frog sprites

- **Turnaround strip:** 5 equal frames, source width divided by 5.
- **Jump cycle:** Transform-based squash on `rh27_frog_waving.png` plus turnaround frames 2–4 during mid-scroll (no separate jump PNG yet).

## Chapters (future)

`Rh27Landing` supports `data-chapter` sections. v1 is chapter `hero` only (~120vh scroll for parallax room).
