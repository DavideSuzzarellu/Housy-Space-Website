/** Horizontal menu densities, roomiest first (Header.astro styles each one). */
export const NAV_DENSITIES = ["full", "tight", "xtight"] as const;
export type NavDensity = (typeof NAV_DENSITIES)[number];

/** A density, or `compact`: the menu moves behind the "Menu" button (drawer). */
export type NavMode = NavDensity | "compact";

/**
 * The header shows the horizontal menu only when it fits beside the logo and actions, measured
 * rather than by a fixed breakpoint: the roomiest density whose menu width fits `available`,
 * else `compact`. The menu is never clipped.
 */
export function chooseNavMode(
  available: number,
  widths: Readonly<Record<NavDensity, number>>,
): NavMode {
  return NAV_DENSITIES.find((density) => widths[density] <= available) ?? "compact";
}
