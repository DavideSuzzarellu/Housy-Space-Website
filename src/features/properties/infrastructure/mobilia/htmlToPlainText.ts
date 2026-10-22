/**
 * Mobilia descriptions are HTML fragments. The domain stores plain text (paragraphs separated
 * by blank lines) so no third-party markup is ever injected into the site.
 */

const NAMED_ENTITIES: Readonly<Record<string, string>> = {
  nbsp: " ",
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  euro: "€",
  deg: "°",
  sup2: "²",
  sup3: "³",
  ordm: "º",
  ordf: "ª",
  middot: "·",
  laquo: "«",
  raquo: "»",
  iexcl: "¡",
  iquest: "¿",
  ndash: "–",
  mdash: "—",
  hellip: "…",
  rsquo: "’",
  lsquo: "‘",
  ldquo: "“",
  rdquo: "”",
  bull: "•",
};

/** Accented letters: `&aacute;` → `á`, `&Ntilde;` → `Ñ`, `&ccedil;` → `ç`, `&uuml;` → `ü`. */
const ACCENT_MARKS: Readonly<Record<string, string>> = {
  acute: "́",
  grave: "̀",
  tilde: "̃",
  cedil: "̧",
  uml: "̈",
  circ: "̂",
};

function decodeEntity(entity: string): string | undefined {
  if (entity.startsWith("#x") || entity.startsWith("#X")) {
    const code = Number.parseInt(entity.slice(2), 16);
    return Number.isNaN(code) ? undefined : String.fromCodePoint(code);
  }
  if (entity.startsWith("#")) {
    const code = Number.parseInt(entity.slice(1), 10);
    return Number.isNaN(code) ? undefined : String.fromCodePoint(code);
  }
  const named = NAMED_ENTITIES[entity];
  if (named !== undefined) return named;
  const accent = /^([a-zA-Z])(acute|grave|tilde|cedil|uml|circ)$/.exec(entity);
  if (accent?.[1] !== undefined && accent[2] !== undefined) {
    const mark = ACCENT_MARKS[accent[2]];
    return mark === undefined ? undefined : `${accent[1]}${mark}`.normalize("NFC");
  }
  return undefined;
}

function decodeEntities(input: string): string {
  return input.replace(/&(#[xX]?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, entity: string) => {
    return decodeEntity(entity) ?? match;
  });
}

export function htmlToPlainText(html: string): string {
  const withoutTags = html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<sup>\s*2\s*<\/sup>/gi, "²")
    .replace(/<sup>\s*3\s*<\/sup>/gi, "³")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n• ")
    .replace(/<\/(p|div|li|ul|ol|h[1-6])>/gi, "\n\n")
    .replace(/<[^>]*>/g, "");

  return decodeEntities(withoutTags)
    .replace(/[ \t\u00a0]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
