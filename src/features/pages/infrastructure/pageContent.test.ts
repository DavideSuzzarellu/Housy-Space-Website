import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { z } from "astro/zod";
import { describe, expect, it } from "vitest";
import { marketSchema } from "@/features/districts/infrastructure/marketSchema";
import shapes from "@/features/districts/infrastructure/shapes.json";
import { resolveContentHref } from "@/shared/i18n/contentLinks";
import { pageSchema } from "./pageSchema";

const PAGES_DIR = "src/content/pages";
const schema = pageSchema(() => z.string().regex(/^\.\.\/\.\.\/assets\/[\w./-]+$/));
const files = readdirSync(PAGES_DIR).filter((file) => file.endsWith(".json"));
const read = (file: string): unknown =>
  JSON.parse(readFileSync(path.join(PAGES_DIR, file), "utf8"));

/** Every string in a JSON value, however deep. */
function strings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (typeof value === "object" && value !== null) return Object.values(value).flatMap(strings);
  return [];
}

describe("editorial pages", () => {
  it("has the 21 pages of the proposal", () => {
    expect(files).toHaveLength(21);
  });

  it.each(files)("%s validates against the schema", (file) => {
    const result = schema.safeParse(read(file));
    expect(result.success, JSON.stringify(result.error?.issues.slice(0, 3))).toBe(true);
  });

  it.each(files)("%s only links to pages that exist", (file) => {
    const targets = strings(read(file)).flatMap((text) =>
      [...text.matchAll(/\]\(([^)\s]+)\)/g)].map((match) => match[1] ?? ""),
    );
    for (const target of targets) {
      expect(() => resolveContentHref(target, "es"), target).not.toThrow();
    }
  });

  it.each(files)("%s has no prototype leftovers", (file) => {
    const all = strings(read(file));
    expect(all).not.toContain("Imagen conceptual (IA)");
    expect(all).not.toContain("web");
  });
});

describe("market data", () => {
  const market = marketSchema.parse(
    JSON.parse(readFileSync("src/content/market/barcelona.json", "utf8")),
  );

  it("covers every district and barrio of Barcelona", () => {
    expect(market.districts).toHaveLength(10);
    expect(market.barrios).toHaveLength(73);
    for (const district of market.districts) {
      const barrios = market.barrios.filter((barrio) => barrio.district === district.slug);
      expect(barrios, district.name).toHaveLength(district.barrioCount);
    }
  });

  it("has a shape for each of them", () => {
    expect(Object.keys(shapes.barrios).sort()).toEqual(market.barrios.map((b) => b.slug).sort());
    expect(Object.keys(shapes.districts).sort()).toEqual(
      market.districts.map((d) => d.slug).sort(),
    );
  });
});
