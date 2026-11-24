import { readFileSync } from "node:fs";
import { z } from "astro/zod";
import { describe, expect, it } from "vitest";
import { splitFrontmatter } from "./articleFiles";
import { blogSchema } from "./blogSchema";

const schema = blogSchema(() => z.string());

/** The template is what the editorial assistant copies: it must never drift from the schema. */
describe("docs/blog/plantilla-articulo.md", () => {
  const doc = readFileSync("docs/blog/plantilla-articulo.md", "utf8");
  const block = /```markdown\n([\s\S]*?)\n```/.exec(doc)?.[1] ?? "";
  const { data } = splitFrontmatter(block);

  it("declares exactly the fields of the article schema", () => {
    expect(Object.keys(data as Record<string, unknown>).sort()).toEqual(
      Object.keys(schema.shape).sort(),
    );
  });

  it("becomes a valid article once the blanks are filled in", () => {
    const filled = {
      ...(data as Record<string, unknown>),
      description: "d".repeat(148),
      reviewedAt: "2026-11-28",
      seoTitle: "Cuánto vale mi piso en Barcelona",
      updatedAt: "2026-11-29",
      author: "HousySpace",
    };
    expect(schema.safeParse(filled).error?.issues ?? []).toEqual([]);
  });
});
