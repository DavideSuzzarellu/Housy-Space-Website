/**
 * Inline syntax of editable text: `**bold**` and `[label](target)`. It is the only markup content
 * editors use and it never becomes raw HTML. Internal targets are symbolic (`route:contact`,
 * `service:valoracion`, `district:gracia`, optional `#fragment`) and resolved per locale by the
 * caller, so content files never hold a localized URL.
 */
export type InlineSegment =
  | { readonly type: "text"; readonly text: string }
  | { readonly type: "strong"; readonly text: string }
  | { readonly type: "link"; readonly text: string; readonly target: string };

const TOKEN = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;

export function parseInline(source: string): InlineSegment[] {
  const segments: InlineSegment[] = [];
  let cursor = 0;
  for (const match of source.matchAll(TOKEN)) {
    if (match.index > cursor)
      segments.push({ type: "text", text: source.slice(cursor, match.index) });
    const [whole, strong, label, target] = match;
    if (strong !== undefined) segments.push({ type: "strong", text: strong });
    else if (label !== undefined && target !== undefined) {
      segments.push({ type: "link", text: label, target });
    }
    cursor = match.index + whole.length;
  }
  if (cursor < source.length) segments.push({ type: "text", text: source.slice(cursor) });
  return segments;
}

/** The text without its markup (WhatsApp messages, plain labels). */
export function plainInline(source: string): string {
  return parseInline(source)
    .map((segment) => segment.text)
    .join("");
}
