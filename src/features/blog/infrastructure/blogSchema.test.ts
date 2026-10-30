import { readFileSync } from "node:fs";
import { z } from "astro/zod";
import { describe, expect, it } from "vitest";
import { BLOG_CATEGORIES, blogSchema } from "./blogSchema";

const schema = blogSchema(() => z.string());
const VALID = {
  title: "Título",
  description: "Entradilla",
  date: "2026-10-30",
  category: "Mercado",
  language: "es",
  image: "../../assets/home/sky-1400.jpg",
  imageAlt: "Vista de la ciudad",
};

describe("blog article schema", () => {
  it("accepts what the CMS form writes and defaults draft to false", () => {
    const parsed = schema.parse(VALID);
    expect(parsed.draft).toBe(false);
    expect(parsed.date).toBeInstanceOf(Date);
  });

  it("rejects unknown fields and unknown categories", () => {
    expect(schema.safeParse({ ...VALID, extra: 1 }).success).toBe(false);
    expect(schema.safeParse({ ...VALID, category: "Otra" }).success).toBe(false);
  });

  it("has a CMS form field for every schema field, plus the body", () => {
    const config = readFileSync(".pages.yml", "utf8");
    const form = config.slice(config.indexOf("name: blog"));
    for (const key of [...Object.keys(schema.shape), "body"]) {
      expect(form, key).toMatch(new RegExp(`name: ${key}\\b`));
    }
    for (const category of BLOG_CATEGORIES) expect(form).toContain(category);
    expect(form).toContain("path: src/content/blog");
  });
});
