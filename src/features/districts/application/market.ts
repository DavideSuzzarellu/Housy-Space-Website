import { getCollection, getEntry } from "astro:content";
import type { MarketData } from "@/features/districts/infrastructure/marketSchema";
import type { ZoneText } from "@/features/districts/infrastructure/zoneTextSchema";
import { DEFAULT_LOCALE, type Locale } from "@/shared/i18n/config";
import { mergeZoneText } from "./zoneText";

let texts: Promise<ReadonlyMap<string, ZoneText>> | undefined;

/** Every prose entry, read once per build (332 small files). */
function loadTexts(): Promise<ReadonlyMap<string, ZoneText>> {
  texts ??= getCollection("marketText").then(
    (entries) => new Map(entries.map((entry) => [entry.id, entry.data])),
  );
  return texts;
}

/** Figures plus the prose of `locale`; untranslated entries come in Spanish (`proseFallback`). */
export async function getMarket(locale: Locale = DEFAULT_LOCALE): Promise<MarketData> {
  const entry = await getEntry("market", "barcelona");
  if (entry === undefined) throw new Error("Missing market data");
  return mergeZoneText(entry.data, await loadTexts(), locale);
}
