/** Lowercase, accent-free text for comparisons ("Cuánto" matches "cuanto"). */
export function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** True when `phrase` appears in `text` as whole words, ignoring case and accents. */
export function containsPhrase(text: string, phrase: string): boolean {
  const haystack = ` ${normalizeText(text).replace(/[^\p{L}\p{N}%]+/gu, " ")} `;
  const needle = normalizeText(phrase)
    .replace(/[^\p{L}\p{N}%]+/gu, " ")
    .trim();
  return needle !== "" && haystack.includes(` ${needle} `);
}
