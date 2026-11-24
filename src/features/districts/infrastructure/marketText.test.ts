import { describe, expect, it } from "vitest";
import market from "@/content/market/barcelona.json";
import { marketSchema } from "./marketSchema";

/** Prose quotes official figures; they must be the ones of the collection (AGENTS.md 6.2). */
const format = new Intl.NumberFormat("es-ES", { useGrouping: "always" });

function quoted(text: string): string[] {
  return [...text.matchAll(/(\d[\d.]*) €\/(m²|mes)/g)].map((match) => `${match[1]} ${match[2]}`);
}

describe("market prose", () => {
  const data = marketSchema.parse(market);

  it("every barrio has its lead, two paragraphs and a housing note", () => {
    for (const barrio of data.barrios) {
      expect(barrio.lead, barrio.slug).not.toBe("");
      expect(barrio.text, barrio.slug).toHaveLength(2);
      expect(barrio.housing, barrio.slug).not.toBe("");
    }
  });

  it("the €/m² and €/mes quoted in the prose are figures of the collection", () => {
    for (const district of data.districts) {
      const rows = [
        district,
        ...data.barrios.filter((barrio) => barrio.district === district.slug),
      ];
      const allowed = new Set([
        ...rows.flatMap((row) => [
          `${format.format(row.sale)} m²`,
          `${format.format(row.rent)} mes`,
        ]),
        `${format.format(data.city.sale)} m²`,
        `${format.format(data.city.rent)} mes`,
      ]);
      const texts = [
        ...district.history,
        ...data.barrios
          .filter((barrio) => barrio.district === district.slug)
          .flatMap((barrio) => [barrio.lead, ...barrio.text]),
      ];
      for (const figure of texts.flatMap(quoted)) {
        expect(allowed.has(figure), `${district.slug}: ${figure}`).toBe(true);
      }
    }
  });
});
