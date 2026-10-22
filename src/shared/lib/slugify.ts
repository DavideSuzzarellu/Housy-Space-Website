export interface SlugifyOptions {
  /** Maximum length; the slug is cut at the last word boundary that fits. */
  readonly maxLength?: number;
}

/** Letters that Unicode NFD does not decompose into an ASCII base + mark. */
const SPECIAL_LETTERS: Readonly<Record<string, string>> = {
  ß: "ss",
  æ: "ae",
  œ: "oe",
  ø: "o",
  đ: "d",
  ł: "l",
  ı: "i",
};

const COMBINING_MARKS = /[̀-ͯ]/g;
/** Catalan middle dot (`l·l`) joins letters of the same word. */
const WORD_JOINERS = /[·‧]/g;
const NON_ALPHANUMERIC_RUN = /[^a-z0-9]+/g;
const EDGE_HYPHENS = /^-+|-+$/g;

/**
 * Converts any text into a URL slug: lowercase ASCII letters and digits
 * separated by single hyphens, accents stripped (`Gràcia` → `gracia`).
 */
export function slugify(input: string, options: SlugifyOptions = {}): string {
  const slug = input
    .normalize("NFD")
    .replace(COMBINING_MARKS, "")
    .toLowerCase()
    .replace(/[ßæœøđłı]/g, (letter) => SPECIAL_LETTERS[letter] ?? "")
    .replace(WORD_JOINERS, "")
    .replace(NON_ALPHANUMERIC_RUN, "-")
    .replace(EDGE_HYPHENS, "");

  const { maxLength } = options;
  if (maxLength === undefined || slug.length <= maxLength) return slug;

  const cut = slug.slice(0, maxLength);
  const lastHyphen = cut.lastIndexOf("-");
  const truncated =
    slug.charAt(maxLength) === "-" || lastHyphen <= 0 ? cut : cut.slice(0, lastHyphen);
  return truncated.replace(EDGE_HYPHENS, "");
}
