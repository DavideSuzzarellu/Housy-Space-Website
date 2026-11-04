import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { municipalitiesSchema } from "./municipalitySchema";

const data: unknown = JSON.parse(
  readFileSync("src/content/municipalities/barcelona-province.json", "utf8"),
);

describe("municipalitiesSchema", () => {
  it("validates the 311 municipalities of the province of Barcelona with unique slugs", () => {
    const parsed = municipalitiesSchema.parse(data);
    expect(parsed.municipalities).toHaveLength(311);
    expect(new Set(parsed.municipalities.map((item) => item.slug)).size).toBe(311);
    expect(parsed.municipalities.find((item) => item.slug === "barcelona")).toMatchObject({
      code: "080193",
      comarca: "Barcelonès",
    });
  });

  it("rejects a malformed territorial code or slug", () => {
    const base = {
      source: { provider: "ICGC", url: "https://www.icgc.cat/", license: "CC BY 4.0" },
    };
    const bad = (overrides: object) => ({
      ...base,
      municipalities: [
        {
          code: "080193",
          name: "Barcelona",
          slug: "barcelona",
          comarca: "Barcelonès",
          areaKm2: 101.67,
          ...overrides,
        },
      ],
    });
    expect(municipalitiesSchema.safeParse(bad({ code: "8019" })).success).toBe(false);
    expect(municipalitiesSchema.safeParse(bad({ slug: "Bar celona" })).success).toBe(false);
    expect(municipalitiesSchema.safeParse(bad({ areaKm2: -1 })).success).toBe(false);
  });
});
