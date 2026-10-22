/** Next slide index for the gallery lightbox, wrapping at both ends. */
export function stepIndex(current: number, delta: number, count: number): number {
  if (count <= 1) return 0;
  return (((current + delta) % count) + count) % count;
}
