import { normalizeText } from "./text";

export const SHINGLE_WORDS = 5;
/** Conservative: two different articles on one topic stay well under this. */
export const DUPLICATE_THRESHOLD = 0.4;

/** The set of every run of `size` consecutive words of the text (accents and case ignored). */
export function shingles(text: string, size = SHINGLE_WORDS): Set<string> {
  const words = normalizeText(text)
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .split(" ")
    .filter((word) => word !== "");
  const set = new Set<string>();
  for (let index = 0; index + size <= words.length; index++) {
    set.add(words.slice(index, index + size).join(" "));
  }
  return set;
}

/** Jaccard similarity of two sets: shared / total distinct, 0 for two empty sets. */
export function jaccard(a: ReadonlySet<string>, b: ReadonlySet<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let shared = 0;
  for (const item of a) if (b.has(item)) shared++;
  return shared / (a.size + b.size - shared);
}
