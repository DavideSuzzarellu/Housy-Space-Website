/** Small, dependency-free reading of an article body (Markdown with raw HTML allowed). */

export const READING_WORDS_PER_MINUTE = 200;

export interface BodyHeading {
  readonly depth: number;
  readonly text: string;
}

export interface BodyLink {
  readonly text: string;
  /** As written in the source (may carry a query or a fragment). */
  readonly href: string;
}

const FENCE = /^\s*(```|~~~)/;
const MD_HEADING = /^(#{1,6})\s+(.*?)\s*#*\s*$/;
const HTML_HEADING = /<h([1-6])\b[^>]*>(.*?)<\/h\1>/gis;
const MD_LINK = /(?<!!)\[([^\]]*)\]\(\s*([^)\s]+)(?:\s+"[^"]*")?\s*\)/g;
const HTML_LINK = /<a\s[^>]*?href\s*=\s*["']([^"']+)["'][^>]*>(.*?)<\/a>/gis;

/** The body without fenced code blocks (their content is never headings, links or words). */
function withoutFences(markdown: string): string {
  const kept: string[] = [];
  let inside = false;
  for (const line of markdown.split(/\r?\n/)) {
    if (FENCE.test(line)) {
      inside = !inside;
      continue;
    }
    if (!inside) kept.push(line);
  }
  return kept.join("\n");
}

function plainInline(text: string): string {
  return text
    .replace(/<[^>]+>/g, "")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`~]/g, "")
    .trim();
}

export function extractHeadings(markdown: string): BodyHeading[] {
  const headings: BodyHeading[] = [];
  for (const line of withoutFences(markdown).split("\n")) {
    const md = MD_HEADING.exec(line);
    if (md?.[1] !== undefined && md[2] !== undefined) {
      headings.push({ depth: md[1].length, text: plainInline(md[2]) });
      continue;
    }
    for (const html of line.matchAll(HTML_HEADING)) {
      headings.push({ depth: Number(html[1]), text: plainInline(html[2] ?? "") });
    }
  }
  return headings;
}

export function extractLinks(markdown: string): BodyLink[] {
  const body = withoutFences(markdown);
  const found: { index: number; link: BodyLink }[] = [];
  for (const match of body.matchAll(MD_LINK)) {
    found.push({
      index: match.index,
      link: { text: plainInline(match[1] ?? ""), href: match[2] ?? "" },
    });
  }
  for (const match of body.matchAll(HTML_LINK)) {
    found.push({
      index: match.index,
      link: { text: plainInline(match[2] ?? ""), href: match[1] ?? "" },
    });
  }
  return found.sort((a, b) => a.index - b.index).map((entry) => entry.link);
}

/** Visible text of the body: no code blocks, tags, link targets or Markdown punctuation. */
export function plainText(markdown: string): string {
  return withoutFences(markdown)
    .replace(/<[^>]+>/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+[.)])\s+/gm, "")
    .replace(/[*_`~|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function words(markdown: string): string[] {
  return plainText(markdown)
    .split(" ")
    .filter((word) => /[\p{L}\p{N}]/u.test(word));
}

export function countWords(markdown: string): number {
  return words(markdown).length;
}

/** Reading time in whole minutes (at least 1), computed at build time. */
export function readingMinutes(markdown: string): number {
  return Math.max(1, Math.ceil(countWords(markdown) / READING_WORDS_PER_MINUTE));
}

export function firstWords(markdown: string, count: number): string {
  return words(markdown).slice(0, count).join(" ");
}
