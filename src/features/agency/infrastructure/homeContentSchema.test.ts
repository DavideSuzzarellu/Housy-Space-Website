import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { z } from "astro/zod";
import { describe, expect, it } from "vitest";
import ca from "../../../content/home/ca.json";
import en from "../../../content/home/en.json";
import es from "../../../content/home/es.json";
import it_ from "../../../content/home/it.json";
import { homeContentSchema } from "./homeContentSchema";

/** Stand-in for Astro's `image()`: a path relative to the content file, resolved by Astro at build. */
const relativeImage = () =>
  z.string().regex(/^\.\.\/\.\.\/assets\/[\w./-]+\.(jpe?g|png|webp|avif)$/);
const schema = homeContentSchema(relativeImage);
const CONTENT_DIR = "src/content/home";
const files = { es, en, it: it_, ca } as const;

/** Leaf key paths, to compare the shape of every locale with Spanish. */
function shape(value: unknown, prefix = ""): string[] {
  if (Array.isArray(value)) return [`${prefix}[${value.length}]`];
  if (typeof value !== "object" || value === null) return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    shape(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe("home content (Pages CMS files)", () => {
  it.each(Object.entries(files))("%s validates against the schema", (_locale, data) => {
    const result = schema.safeParse(data);
    expect(result.success, JSON.stringify(result.error?.issues)).toBe(true);
  });

  it.each(Object.entries(files))(
    "%s has the same fields and list lengths as es",
    (_locale, data) => {
      expect(shape(data)).toEqual(shape(es));
    },
  );

  it.each(Object.entries(files))(
    "%s only references images and videos that exist",
    (_locale, data) => {
      const parsed = schema.parse(data);
      for (const image of [
        parsed.hero.posterLandscape,
        parsed.hero.posterPortrait,
        parsed.valuation.image,
      ]) {
        expect(existsSync(path.join(CONTENT_DIR, image)), image).toBe(true);
      }
      for (const video of [parsed.hero.videoLandscape, parsed.hero.videoPortrait]) {
        expect(existsSync(path.join("public", video)), video).toBe(true);
      }
    },
  );

  it("has a Pages CMS form field for every content key, and one entry per locale", () => {
    const config = readFileSync(".pages.yml", "utf8");
    const keys = new Set(shape(es).flatMap((leaf) => leaf.replace(/\[\d+\]$/, "").split(".")));
    for (const key of keys) expect(config, key).toMatch(new RegExp(`name: ${key}\\b`));
    for (const locale of Object.keys(files)) {
      expect(config).toContain(`path: src/content/home/${locale}.json`);
    }
  });

  it("rejects unknown fields and unbalanced *emphasis* markers", () => {
    expect(schema.safeParse({ ...es, extra: true }).success).toBe(false);
    const broken = { ...es, blog: { ...es.blog, heading: "Barrios, arquitectura *y mercado." } };
    expect(schema.safeParse(broken).success).toBe(false);
  });
});
