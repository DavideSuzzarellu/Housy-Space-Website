/** A piece of prose, linked to a barrio page when `slug` is set. */
export interface ProseSegment {
  readonly text: string;
  readonly slug?: string;
}

/**
 * Splits a paragraph so each official barrio name in it (any case: "la Dreta de l'Eixample" in
 * running text, "La Dreta..." in the data) becomes a link. Longest names win, so "Sants-Badal"
 * is not read as "Sants". Only paragraphs quoting prices (`€/m²`) are linked, as in the reference.
 */
export function linkBarrioNames(
  paragraph: string,
  barrios: readonly { readonly slug: string; readonly name: string }[],
): ProseSegment[] {
  if (!paragraph.includes("€/m²")) return [{ text: paragraph }];
  const lower = paragraph.toLowerCase();
  const names = [...barrios].sort((a, b) => b.name.length - a.name.length);
  const found: { start: number; end: number; slug: string }[] = [];
  for (const { slug, name } of names) {
    const needle = name.toLowerCase();
    let from = 0;
    for (;;) {
      const start = lower.indexOf(needle, from);
      if (start < 0) break;
      const end = start + needle.length;
      if (!found.some((hit) => start < hit.end && end > hit.start))
        found.push({ start, end, slug });
      from = end;
    }
  }
  found.sort((a, b) => a.start - b.start);
  const segments: ProseSegment[] = [];
  let cursor = 0;
  for (const hit of found) {
    if (hit.start > cursor) segments.push({ text: paragraph.slice(cursor, hit.start) });
    segments.push({ text: paragraph.slice(hit.start, hit.end), slug: hit.slug });
    cursor = hit.end;
  }
  if (cursor < paragraph.length) segments.push({ text: paragraph.slice(cursor) });
  return segments;
}
