import { describe, expect, it } from "vitest";
import market from "@/content/market/barcelona.json";
import { DISTRICTS } from "@/features/districts/domain/districts";
import { LOCALE_META, LOCALES, type Locale } from "@/shared/i18n/config";
import { marketSchema } from "./marketSchema";
import { ZONE_TEXT_FILES } from "./zoneTextFiles";
import { zoneTextId } from "./zoneTextSchema";

/** Prose quotes official figures; they must be the ones of the collection (AGENTS.md 6.2). */
const UNIT = "m²|mes|month|mese";
const unitKey = (unit: string): string => (unit === "m²" ? "m²" : "mes");

function quoted(text: string): string[] {
  // "3.499 €/m²" (any locale unit) and "€3,499/m²"
  const after = [...text.matchAll(new RegExp(`(\\d[\\d.,]*\\d|\\d) €/(${UNIT})`, "g"))].map(
    (match) => `${match[1]} ${unitKey(match[2] ?? "")}`,
  );
  const before = [...text.matchAll(new RegExp(`€\\s?(\\d[\\d.,]*\\d|\\d)/(${UNIT})`, "g"))].map(
    (match) => `${match[1]} ${unitKey(match[2] ?? "")}`,
  );
  return [...after, ...before];
}

/** A figure may be written in Spanish format or in the locale's own ("1.234" / "1,234"). */
function formats(locale: Locale): Intl.NumberFormat[] {
  return [
    new Intl.NumberFormat("es-ES", { useGrouping: "always" }),
    new Intl.NumberFormat(LOCALE_META[locale].langTag, { useGrouping: "always" }),
  ];
}

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

  it("the figure guard reads the units of every locale", () => {
    expect(quoted("3.499 €/m², 1.234 €/mes, 1,234 €/month, 1.234 €/mese and €3,499/m²")).toEqual([
      "3.499 m²",
      "1.234 mes",
      "1,234 mes",
      "1.234 mes",
      "3,499 m²",
    ]);
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
        const allowed = new Set(
          [...rows, data.city].flatMap((row) =>
            formats(locale).flatMap((format) => [
              `${format.format(row.sale)} m²`,
              `${format.format(row.rent)} mes`,
            ]),
          ),
        );
        const texts = [
          ...proseOf(locale, "district", district.slug),
          ...data.barrios
            .filter((barrio) => barrio.district === district.slug)
            .flatMap((barrio) => proseOf(locale, "barrio", barrio.slug)),
        ];
        for (const figure of texts.flatMap(quoted)) {
          expect(allowed.has(figure), `${locale} ${district.slug}: ${figure}`).toBe(true);
        }
      }
    },
  );
});
