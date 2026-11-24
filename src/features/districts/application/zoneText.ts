import type {
  MarketBarrio,
  MarketData,
  MarketDistrict,
  MarketNumbers,
} from "@/features/districts/infrastructure/marketSchema";
import {
  type ZoneKind,
  type ZoneText,
  zoneTextId,
} from "@/features/districts/infrastructure/zoneTextSchema";
import { DEFAULT_LOCALE, type Locale } from "@/shared/i18n/config";

/**
 * Joins the figures of the `market` collection with the prose of `marketText` for one locale.
 * A slug without a translated file in that locale takes the Spanish source and is flagged
 * `proseFallback` (the page marks it `lang="es"`).
 */
export function mergeZoneText(
  numbers: MarketNumbers,
  texts: ReadonlyMap<string, ZoneText>,
  locale: Locale,
): MarketData {
  function pick(kind: ZoneKind, slug: string): { text: ZoneText; proseFallback: boolean } {
    const own = texts.get(zoneTextId(locale, kind, slug));
    if (own?.translated === true) return { text: own, proseFallback: false };
    const source = texts.get(zoneTextId(DEFAULT_LOCALE, kind, slug));
    if (source === undefined) throw new Error(`Missing prose: ${slug}`);
    return { text: source, proseFallback: true };
  }
  return {
    ...numbers,
    districts: numbers.districts.map((district): MarketDistrict => {
      const { text, proseFallback } = pick("district", district.slug);
      if (text.kind !== "district") throw new Error(`Not a district text: ${district.slug}`);
      return {
        ...district,
        lead: text.lead,
        history: text.history,
        summary: text.summary,
        landmarks: text.landmarks,
        proseFallback,
      };
    }),
    barrios: numbers.barrios.map((barrio): MarketBarrio => {
      const { text, proseFallback } = pick("barrio", barrio.slug);
      if (text.kind !== "barrio") throw new Error(`Not a barrio text: ${barrio.slug}`);
      return {
        ...barrio,
        lead: text.lead,
        text: text.text,
        housing: text.housing,
        places: text.places,
        proseFallback,
      };
    }),
  };
}
