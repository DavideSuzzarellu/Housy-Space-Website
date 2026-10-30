/** Index of the panel `step` positions away, wrapping around both ends. */
export function wrapIndex(index: number, step: number, count: number): number {
  return (((index + step) % count) + count) % count;
}
