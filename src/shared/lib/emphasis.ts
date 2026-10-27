/**
 * Editable headings mark their italic part with asterisks, e.g. `Lo que dicen *de HousySpace*.`
 * (UI proposal v3 emphasises part of each section heading). Content editors type plain text in
 * the CMS; this is the only markup they need, and it never becomes HTML from their input.
 */
export interface EmphasisSegment {
  readonly text: string;
  readonly emphasis: boolean;
}

const MARKED = /\*([^*]+)\*/g;

/** Every `*` opens or closes an emphasised part: an odd count means one was left open. */
export function hasBalancedEmphasis(text: string): boolean {
  return (text.match(/\*/g) ?? []).length % 2 === 0;
}

/** Splits `a *b* c` into plain and emphasised segments. Unbalanced text stays plain. */
export function splitEmphasis(text: string): EmphasisSegment[] {
  if (!hasBalancedEmphasis(text)) return [{ text, emphasis: false }];
  const segments: EmphasisSegment[] = [];
  let cursor = 0;
  for (const match of text.matchAll(MARKED)) {
    const before = text.slice(cursor, match.index);
    if (before !== "") segments.push({ text: before, emphasis: false });
    segments.push({ text: match[1] ?? "", emphasis: true });
    cursor = match.index + match[0].length;
  }
  const rest = text.slice(cursor);
  if (rest !== "") segments.push({ text: rest, emphasis: false });
  return segments;
}
