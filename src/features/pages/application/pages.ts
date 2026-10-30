import { getEntry, type CollectionEntry } from "astro:content";
import { DEFAULT_LOCALE, type Locale } from "@/shared/i18n/config";

/** Pages rendered from `src/content/pages`, by route key. */
export const EDITORIAL = [
  "about",
  "contact",
  "legalNotice",
  "privacy",
  "cookies",
  "dataSources",
  "internationalGuide",
  "customSearch",
  "homeSearch",
  "valuation",
  "blog",
] as const;
export type EditorialKey = (typeof EDITORIAL)[number];
/** Content file name when it differs from the route key. */
export const CONTENT_FILE: Partial<Record<EditorialKey, string>> = { legalNotice: "legal" };

export type PageContent = CollectionEntry<"pages">["data"];
export type PageSection = PageContent["sections"][number];
export type PageItem = PageSection["items"][number];

/** Item kinds laid out side by side when they come in a row. */
const GROUPED_KINDS = new Set(["card", "article", "faq"]);

export type RenderUnit<T> =
  | { readonly type: "single"; readonly item: T }
  | { readonly type: "group"; readonly kind: string; readonly items: readonly T[] };

/** Merges consecutive cards, articles and FAQ entries into one group each. */
export function groupItems<T extends { readonly kind: string }>(
  items: readonly T[],
): RenderUnit<T>[] {
  const units: RenderUnit<T>[] = [];
  for (const item of items) {
    const last = units.at(-1);
    if (GROUPED_KINDS.has(item.kind)) {
      if (last?.type === "group" && last.kind === item.kind) {
        units[units.length - 1] = { ...last, items: [...last.items, item] };
      } else {
        units.push({ type: "group", kind: item.kind, items: [item] });
      }
    } else {
      units.push({ type: "single", item });
    }
  }
  return units;
}

export interface LoadedPage {
  readonly content: PageContent;
  /** Not translated yet: the Spanish text is shown and the page stays out of the index. */
  readonly fallback: boolean;
}

export async function getPage(key: string, locale: Locale): Promise<LoadedPage> {
  const entry = await getEntry("pages", `${key}.${locale}`);
  if (entry !== undefined) return { content: entry.data, fallback: false };
  const base = await getEntry("pages", `${key}.${DEFAULT_LOCALE}`);
  if (base === undefined) throw new Error(`Missing page content "${key}"`);
  return { content: base.data, fallback: locale !== DEFAULT_LOCALE };
}
