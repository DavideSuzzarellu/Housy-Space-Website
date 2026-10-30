/** Official sources shown under every figure (AGENTS.md §6.2). */
export const SOURCES = {
  saleUrl: "https://portaldades.ajuntament.barcelona.cat/ca/estadistiques/bxtvnxvukh",
  rentUrl: "https://portaldades.ajuntament.barcelona.cat/ca/estadistiques/b37xv8wcjh",
  sale: (t: { readonly saleSource: string }) => t.saleSource,
  rent: (t: { readonly rentSource: string }) => t.rentSource,
} as const;

/** New array sorted by `value`, highest first. */
export function byDescending<T>(items: readonly T[], value: (item: T) => number): T[] {
  return [...items].sort((a, b) => value(b) - value(a));
}
