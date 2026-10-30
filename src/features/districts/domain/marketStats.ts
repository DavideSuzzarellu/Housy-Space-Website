/** Pure calculations over official market figures. Figures themselves are never estimated (§6.2). */

/** Whole-percent difference of `value` against `reference`, e.g. 2736 vs 4254 → -36. */
export function percentDiff(value: number, reference: number): number {
  return Math.round(((value - reference) / reference) * 100);
}

/** 1-based position of `value` among `values`, highest first. */
export function rankOf(value: number, values: readonly number[]): number {
  return values.filter((candidate) => candidate > value).length + 1;
}

/** Reference price of an 80 m² flat, rounded to the nearest thousand. */
export function flatReferencePrice(pricePerM2: number): number {
  return Math.round((pricePerM2 * 80) / 1000) * 1000;
}
