/** Next slide index for the gallery lightbox, wrapping at both ends. */
export function stepIndex(current: number, delta: number, count: number): number {
  if (count <= 1) return 0;
  return (((current + delta) % count) + count) % count;
}

/**
 * Every slide index ordered by distance from `current` (current, next, previous, +2, −2…):
 * the order the lightbox preloads photos in, so the likely next one is always ready first.
 */
export function preloadOrder(current: number, count: number): number[] {
  const order: number[] = [];
  for (let distance = 0; order.length < count; distance += 1) {
    for (const delta of distance === 0 ? [0] : [distance, -distance]) {
      const index = stepIndex(current, delta, count);
      if (!order.includes(index)) order.push(index);
    }
  }
  return order;
}
