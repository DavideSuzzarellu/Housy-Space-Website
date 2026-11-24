import { describe, expect, it } from "vitest";
import market from "@/content/market/barcelona.json";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/shared/i18n/config";
import { marketSchema } from "./marketSchema";
import { ZONE_TEXT_FILES } from "./zoneTextFiles";
import { type ZoneKind, zoneTextId } from "./zoneTextSchema";

/**
 * Translation progress of the district and barrio prose (docs/translation-batches.md).
 * Default run: structure checks plus a progress report. Strict run (CI before launch):
 * `STRICT_TRANSLATION=1 bun run test` fails while any file is still pending.
 */
const strict = process.env["STRICT_TRANSLATION"] === "1";
const data = marketSchema.parse(market);
const zones: { kind: ZoneKind; slug: string }[] = [
  ...data.districts.map((zone) => ({ kind: "district" as const, slug: zone.slug })),
  ...data.barrios.map((zone) => ({ kind: "barrio" as const, slug: zone.slug })),
];
const others = LOCALES.filter((locale) => locale !== DEFAULT_LOCALE);

const fileOf = (locale: Locale, zone: { kind: ZoneKind; slug: string }) =>
  ZONE_TEXT_FILES.get(zoneTextId(locale, zone.kind, zone.slug));

function pendingIn(locale: Locale): string[] {
  return zones
    .filter((zone) => fileOf(locale, zone)?.translated !== true)
    .map((zone) => `${zone.kind}:${zone.slug}`);
}

describe("zone prose files", () => {
  it.each(LOCALES)("%s has one file per district and barrio, and no extra ones", (locale) => {
    const ids = [...ZONE_TEXT_FILES.keys()].filter((id) => id.startsWith(`${locale}/`)).sort();
    expect(ids).toEqual(zones.map((zone) => zoneTextId(locale, zone.kind, zone.slug)).sort());
  });

  it.each(others)("%s mirrors the Spanish structure of every file", (locale) => {
    for (const zone of zones) {
      const source = fileOf(DEFAULT_LOCALE, zone);
      const target = fileOf(locale, zone);
      const label = `${locale}/${zone.kind}/${zone.slug}`;
      expect(target?.kind, label).toBe(zone.kind);
      if (source?.kind === "district" && target?.kind === "district") {
        expect(target.history, label).toHaveLength(source.history.length);
        expect(target.landmarks, label).toHaveLength(source.landmarks.length);
      }
      if (source?.kind === "barrio" && target?.kind === "barrio") {
        expect(target.text, label).toHaveLength(source.text.length);
        expect(target.places, label).toHaveLength(source.places.length);
      }
    }
  });

  it("Spanish, the source, is always marked translated", () => {
    expect(pendingIn(DEFAULT_LOCALE)).toEqual([]);
  });

  it("reports the translation progress", () => {
    const lines = others.map((locale) => {
      const pending = pendingIn(locale);
      const head = pending.slice(0, 6).join(", ");
      const more = pending.length > 6 ? `, ... (+${pending.length - 6})` : "";
      return `  ${locale}: ${zones.length - pending.length}/${zones.length} translated; pending: ${head}${more}`;
    });
    console.info(`Zone prose translation progress\n${lines.join("\n")}`);
    expect(lines).toHaveLength(others.length);
  });
});

describe.skipIf(!strict)("zone prose, strict (STRICT_TRANSLATION=1)", () => {
  it.each(others)("%s: every district and barrio is translated", (locale) => {
    expect(pendingIn(locale), `untranslated in ${locale}`).toEqual([]);
  });
});
