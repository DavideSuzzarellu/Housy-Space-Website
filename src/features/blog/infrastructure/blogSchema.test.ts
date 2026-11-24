import { readFileSync } from "node:fs";
import { z } from "astro/zod";
import { describe, expect, it } from "vitest";
import { BLOG_CATEGORIES } from "../domain/articleModel";
import { blogSchema } from "./blogSchema";

const schema = blogSchema(() => z.string());
const DESCRIPTION = "d".repeat(148);

/** A complete, publishable, non-legal article as the CMS form writes it. */
const VALID = {
  title: "Cuánto vale mi piso en Barcelona",
  description: DESCRIPTION,
  date: "2026-12-01",
  category: "valoracion",
  language: "es",
  image: "../../assets/home/sky-1400.jpg",
  imageAlt: "Vista de la ciudad",
  articleId: "HS-2026-12-01",
  status: "publicado",
  keyword: "cuanto vale mi piso en barcelona",
  intent: "informacional",
  cluster: "A",
  cta: "valoracion",
  legalFiscal: false,
  reviewedAt: "2026-11-28",
};
const SOURCE = { label: "BOE", url: "https://www.boe.es/", checkedAt: "2026-11-20" };

function messages(input: unknown): string[] {
  const result = schema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe("blog article schema", () => {
  it("accepts what the CMS form writes and applies safe defaults", () => {
    const parsed = schema.parse({ ...VALID, status: "borrador", reviewedAt: undefined });
    expect(parsed.date).toBeInstanceOf(Date);
    expect(parsed.legalReview).toBe("no_aplica");
    expect(parsed.sources).toEqual([]);
  });

  it("rejects unknown fields, the retired `draft` and unknown categories/statuses", () => {
    expect(schema.safeParse({ ...VALID, extra: 1 }).success).toBe(false);
    expect(schema.safeParse({ ...VALID, draft: false }).success).toBe(false);
    expect(schema.safeParse({ ...VALID, category: "Mercado" }).success).toBe(false);
    expect(schema.safeParse({ ...VALID, status: "draft" }).success).toBe(false);
  });

  it("validates the article id format", () => {
    expect(schema.safeParse({ ...VALID, articleId: "HS-2026-12-01" }).success).toBe(true);
    for (const bad of ["HS-2026-13-01", "hs-2026-12-01", "HS-2026-12-1", "2026-12-01"]) {
      expect(schema.safeParse({ ...VALID, articleId: bad }).success, bad).toBe(false);
    }
  });

  it("limits the SEO title to 60 characters", () => {
    expect(schema.safeParse({ ...VALID, seoTitle: "t".repeat(60) }).success).toBe(true);
    expect(schema.safeParse({ ...VALID, seoTitle: "t".repeat(61) }).success).toBe(false);
  });

  it("requires https sources with a check date", () => {
    expect(schema.safeParse({ ...VALID, sources: [SOURCE] }).success).toBe(true);
    expect(
      schema.safeParse({ ...VALID, sources: [{ ...SOURCE, url: "http://www.boe.es/" }] }).success,
    ).toBe(false);
    expect(
      schema.safeParse({ ...VALID, sources: [{ label: "BOE", url: SOURCE.url }] }).success,
    ).toBe(false);
  });

  describe("editorial gates (superRefine)", () => {
    it("requires reviewedAt from `aprobado` on", () => {
      expect(messages({ ...VALID, reviewedAt: undefined })).toHaveLength(1);
      expect(messages({ ...VALID, status: "aprobado", reviewedAt: undefined })).toHaveLength(1);
      expect(messages({ ...VALID, status: "revisado", reviewedAt: undefined })).toHaveLength(0);
    });

    it("requires a 140-155 character description unless it is a draft", () => {
      for (const length of [139, 156]) {
        const description = "d".repeat(length);
        expect(messages({ ...VALID, description })[0], String(length)).toContain("140");
        expect(
          schema.safeParse({ ...VALID, description, status: "borrador", reviewedAt: undefined })
            .success,
        ).toBe(true);
      }
      expect(schema.safeParse({ ...VALID, description: "d".repeat(140) }).success).toBe(true);
      expect(schema.safeParse({ ...VALID, description: "d".repeat(155) }).success).toBe(true);
    });

    it("blocks publishing legal/tax articles without approved legal review and sources", () => {
      const legal = { ...VALID, legalFiscal: true };
      expect(
        schema.safeParse({ ...legal, legalReview: "pendiente", sources: [SOURCE] }).success,
      ).toBe(false);
      expect(schema.safeParse({ ...legal, legalReview: "aprobada", sources: [] }).success).toBe(
        false,
      );
      expect(
        schema.safeParse({ ...legal, legalReview: "aprobada", sources: [SOURCE] }).success,
      ).toBe(true);
    });

    it("never lets a legal/tax article claim `no_aplica`", () => {
      const draft = { ...VALID, status: "borrador", reviewedAt: undefined, legalFiscal: true };
      expect(schema.safeParse({ ...draft, legalReview: "no_aplica" }).success).toBe(false);
      expect(schema.safeParse({ ...draft, legalReview: "pendiente" }).success).toBe(true);
    });

    it("requires sources for non-draft legal/tax articles", () => {
      const reviewed = {
        ...VALID,
        status: "revisado",
        legalFiscal: true,
        legalReview: "pendiente",
      };
      expect(schema.safeParse(reviewed).success).toBe(false);
      expect(schema.safeParse({ ...reviewed, sources: [SOURCE] }).success).toBe(true);
    });

    it("carries a stable machine key next to the Spanish message", () => {
      const result = schema.safeParse({ ...VALID, reviewedAt: undefined });
      const keys = result.success
        ? []
        : result.error.issues.map((issue) => (issue as { params?: { key?: string } }).params?.key);
      expect(keys).toEqual(["reviewed_at_required"]);
    });
  });

  it("has a CMS form field for every schema field, plus the body", () => {
    const config = readFileSync(".pages.yml", "utf8");
    const from = config.indexOf("name: blog\n    label: Blog\n    type: collection");
    const form = config.slice(from, config.indexOf("name: testimonials"));
    for (const key of [...Object.keys(schema.shape), "body"]) {
      expect(form, key).toMatch(new RegExp(`name: ${key}\\b`));
    }
    for (const category of BLOG_CATEGORIES) expect(form).toContain(category);
    expect(form).toContain("path: src/content/blog");
  });
});
