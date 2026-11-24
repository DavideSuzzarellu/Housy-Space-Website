import { describe, expect, it } from "vitest";
import market from "@/content/market/barcelona.json";
import { DISTRICTS } from "@/features/districts/domain/districts";
import { extractQuotedFigures, isKnownFigure } from "@/features/districts/domain/marketFigures";
import { LOCALES, type Locale } from "@/shared/i18n/config";
import { marketSchema } from "./marketSchema";
import { ZONE_TEXT_FILES } from "./zoneTextFiles";
import { zoneTextId } from "./zoneTextSchema";

/** Prose quotes official figures; they must be the ones of the collection (AGENTS.md 6.2). */

function proseOf(locale: Locale, kind: "district" | "barrio", slug: string): string[] {
  const text = ZONE_TEXT_FILES.get(zoneTextId(locale, kind, slug));
  if (text?.kind === "district") return text.history;
  if (text?.kind === "barrio") return [text.lead, ...text.text, text.housing];
  throw new Error(`Missing prose: ${locale}/${kind}/${slug}`);
}

describe("market prose", () => {
  const data = marketSchema.parse(market);

  it("district names are the official Catalan ones, the same in every locale", () => {
    expect(data.districts.map((district) => district.name)).toEqual(
      DISTRICTS.map((district) => district.name),
    );
  });

  it("the figures file holds numbers only, no prose", () => {
    for (const zone of [...data.districts, ...data.barrios]) {
      expect(Object.keys(zone), zone.slug).not.toContain("lead");
    }
  });

  it.each(LOCALES)("%s: every barrio has its lead, two paragraphs and a housing note", (locale) => {
    for (const barrio of data.barrios) {
      const text = ZONE_TEXT_FILES.get(zoneTextId(locale, "barrio", barrio.slug));
      if (text?.kind !== "barrio") throw new Error(`${locale}/${barrio.slug}`);
      expect(text.lead, barrio.slug).not.toBe("");
      expect(text.text, barrio.slug).toHaveLength(2);
      expect(text.housing, barrio.slug).not.toBe("");
    }
  });

  it.each(LOCALES)(
    "%s: the €/m² and €/mes quoted in the prose are figures of the collection",
    (locale) => {
      for (const district of data.districts) {
        const rows = [
          district,
          ...data.barrios.filter((barrio) => barrio.district === district.slug),
        ];
        const places = [data.city, ...rows];
        const allowed = {
          perM2: places.map((place) => place.sale),
          perMonth: places.map((place) => place.rent),
        };
        const texts = [
          ...proseOf(locale, "district", district.slug),
          ...data.barrios
            .filter((barrio) => barrio.district === district.slug)
            .flatMap((barrio) => proseOf(locale, "barrio", barrio.slug)),
        ];
        for (const figure of texts.flatMap(extractQuotedFigures)) {
          expect(isKnownFigure(figure, allowed), `${locale} ${district.slug}: ${figure.raw}`).toBe(
            true,
          );
        }
      }
    },
  );
});
