/** Index of the panel `step` positions away, wrapping around both ends. */
export function wrapIndex(index: number, step: number, count: number): number {
  return (((index + step) % count) + count) % count;
}

/**
 * Position of a panel relative to the open one, going round the circle: -side..side for the
 * visible ones (0 = open), `"hl"` / `"hr"` for those hidden on the left / right.
 */
export function panelPosition(
  index: number,
  active: number,
  count: number,
  side: number,
): number | "hl" | "hr" {
  const half = Math.floor(count / 2);
  const rel = ((((index - active + count + half) % count) + count) % count) - half;
  if (Math.abs(rel) <= side) return rel;
  return rel < 0 ? "hl" : "hr";
}
