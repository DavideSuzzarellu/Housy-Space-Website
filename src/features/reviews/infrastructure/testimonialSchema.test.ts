import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { testimonialSchema } from "./testimonialSchema";

const DIR = "src/content/testimonials";
const files = readdirSync(DIR).filter((file) => file.endsWith(".json"));

describe("testimonials", () => {
  it.each(files)("%s validates against the schema", (file) => {
    const result = testimonialSchema.safeParse(
      JSON.parse(readFileSync(path.join(DIR, file), "utf8")),
    );
    expect(result.success, JSON.stringify(result.error?.issues)).toBe(true);
  });

  it("rejects ratings out of range and unknown fields", () => {
    const valid = { author: "A", rating: 5, text: "T", date: "2026-01-01", language: "es" };
    expect(testimonialSchema.safeParse(valid).success).toBe(true);
    expect(testimonialSchema.safeParse({ ...valid, rating: 6 }).success).toBe(false);
    expect(testimonialSchema.safeParse({ ...valid, photo: "x" }).success).toBe(false);
  });

  it("has a CMS form field for every schema field", () => {
    const config = readFileSync(".pages.yml", "utf8");
    const form = config.slice(config.indexOf("name: testimonials"));
    for (const key of Object.keys(testimonialSchema.shape)) {
      expect(form, key).toMatch(new RegExp(`name: ${key}\\b`));
    }
  });
});
