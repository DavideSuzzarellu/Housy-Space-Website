import { describe, expect, it } from "vitest";
import type { ArticleData } from "../infrastructure/articleFiles";
import { buildInventory } from "./inventory";

const data = (overrides: Partial<ArticleData>): ArticleData => ({
  title: "Título | con barra",
  description: "d",
  date: new Date("2026-12-01"),
  category: "valoracion",
  language: "es",
  image: "x.jpg",
  imageAlt: "x",
  articleId: "HS-2026-12-01",
  status: "publicado",
  keyword: "palabra clave",
  intent: "informacional",
  cluster: "A",
  cta: "valoracion",
  legalFiscal: false,
  legalReview: "no_aplica",
  sources: [],
  reviewedAt: new Date("2026-11-28"),
  ...overrides,
});

describe("buildInventory", () => {
  it("lists every article ordered by id, with its URL and review date", () => {
    const markdown = buildInventory([
      { slug: "segundo", data: data({ articleId: "HS-2026-12-02", reviewedAt: undefined }) },
      { slug: "primero", data: data({}) },
    ]);
    const rows = markdown.split("\n").filter((line) => line.startsWith("| HS-"));
    expect(rows[0]).toContain("HS-2026-12-01");
    expect(rows[0]).toContain("/es/blog/primero");
    expect(rows[0]).toContain("2026-11-28");
    expect(rows[1]).toContain("HS-2026-12-02");
    expect(rows[1]).toContain("| - |");
  });

  it("escapes pipes in titles and says when there are no articles", () => {
    expect(buildInventory([{ slug: "a", data: data({}) }])).toContain("Título \\| con barra");
    expect(buildInventory([])).toContain("sin artículos");
  });

  it("states that the file is generated", () => {
    expect(buildInventory([])).toContain("bun run blog:inventory");
  });
});
