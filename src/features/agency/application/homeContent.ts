import { getEntry, type CollectionEntry } from "astro:content";
import type { Locale } from "@/shared/i18n/config";

/** Editorial content of the home page in one locale (Pages CMS, `src/content/home/{locale}.json`). */
export type HomeContent = CollectionEntry<"home">["data"];

/**
 * Every locale has its file (enforced by the content tests); a missing one is a broken
 * deployment, so the build fails loudly instead of rendering an empty home.
 */
export async function getHomeContent(locale: Locale): Promise<HomeContent> {
  const entry = await getEntry("home", locale);
  if (entry === undefined) throw new Error(`Missing home content for locale "${locale}"`);
  return entry.data;
}
