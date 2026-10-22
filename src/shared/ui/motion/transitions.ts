import type { TransitionDirectionalAnimations } from "astro";

/**
 * View-transition presets — defined ONCE here (AGENTS.md §3.3). Calm, ease-out, 250–400 ms.
 * The shared-element group duration/easing lives in motion.css with the same values.
 * ClientRouter disables every animation under `prefers-reduced-motion`; never override it.
 */
export const MORPH_DURATION_MS = 350;
/** Same curve as the `--ease-brand` token in global.css. */
export const EASE_BRAND = "cubic-bezier(0.2, 0.7, 0.2, 1)";

const crossFade = {
  old: {
    name: "astroFadeOut",
    duration: `${MORPH_DURATION_MS}ms`,
    easing: EASE_BRAND,
    fillMode: "both",
  },
  new: {
    name: "astroFadeIn",
    duration: `${MORPH_DURATION_MS}ms`,
    easing: EASE_BRAND,
    fillMode: "both",
  },
} as const;

/** Card ↔ detail shared-element morph (image, title, price). */
export const morph: TransitionDirectionalAnimations = { forwards: crossFade, backwards: crossFade };
