import { describe, expect, it } from "vitest";
import market from "@/content/market/barcelona.json";
import { marketSchema } from "@/features/districts/infrastructure/marketSchema";
import { ZONE_TEXT_FILES } from "@/features/districts/infrastructure/zoneTextFiles";
import { zoneTextId } from "@/features/districts/infrastructure/zoneTextSchema";
import { mergeZoneText } from "./zoneText";

const numbers = marketSchema.parse(market);

function spanish(slug: string) {
  const text = ZONE_TEXT_FILES.get(zoneTextId("es", "district", slug));
  if (text?.kind !== "district") throw new Error(`No Spanish district prose: ${slug}`);
  return text;
}

describe("mergeZoneText", () => {
  it("joins the Spanish prose to every district and barrio", () => {
    const merged = mergeZoneText(numbers, ZONE_TEXT_FILES, "es");
    expect(merged.districts).toHaveLength(10);
    expect(merged.barrios).toHaveLength(73);
    expect(merged.districts.every((district) => !district.proseFallback)).toBe(true);
    const first = merged.districts[0];
    expect(first?.lead).toBe(spanish(first?.slug ?? "").lead);
  });

  it("falls back to Spanish, per entry, when a locale entry is missing or untranslated", () => {
    const [first, second, third] = numbers.districts;
    if (first === undefined || second === undefined || third === undefined) throw new Error("data");
    const texts = new Map(ZONE_TEXT_FILES);
    texts.set(zoneTextId("en", "district", first.slug), {
      ...spanish(first.slug),
      lead: "Translated",
      translated: true,
    });
    texts.set(zoneTextId("en", "district", second.slug), {
      ...spanish(second.slug),
      lead: "Draft",
      translated: false,
    });
    texts.delete(zoneTextId("en", "district", third.slug));
    const [a, b, c] = mergeZoneText(numbers, texts, "en").districts;
    expect(a?.lead).toBe("Translated");
    expect(a?.proseFallback).toBe(false);
    expect(b?.lead).toBe(spanish(second.slug).lead);
    expect(b?.proseFallback).toBe(true);
    expect(c?.lead).toBe(spanish(third.slug).lead);
    expect(c?.proseFallback).toBe(true);
  });

  it("keeps the official names and figures of the numbers collection", () => {
    const merged = mergeZoneText(numbers, ZONE_TEXT_FILES, "ca");
    expect(merged.districts.map((d) => d.name)).toEqual(numbers.districts.map((d) => d.name));
    expect(merged.barrios.map((b) => b.sale)).toEqual(numbers.barrios.map((b) => b.sale));
  });
});
