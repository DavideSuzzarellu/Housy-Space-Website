import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import ca from "../../../content/home/ca.json";
import en from "../../../content/home/en.json";
import es from "../../../content/home/es.json";
import it_ from "../../../content/home/it.json";
import { homeContentSchema } from "./homeContentSchema";

const schema = homeContentSchema();
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
