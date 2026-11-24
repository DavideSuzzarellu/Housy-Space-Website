import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadArticles, splitFrontmatter } from "./articleFiles";

const FRONTMATTER = `title: Título
description: ${"d".repeat(10)}
date: 2026-11-01
category: venta
language: es
image: ../../assets/home/sky-1400.jpg
imageAlt: Vista
articleId: HS-2026-11-01
status: borrador
keyword: vender piso
intent: informacional
cluster: C
cta: venta
legalFiscal: false`;

function folder(files: Record<string, string>): string {
  const dir = mkdtempSync(path.join(tmpdir(), "blog-"));
  for (const [name, content] of Object.entries(files)) writeFileSync(path.join(dir, name), content);
  return dir;
}

describe("splitFrontmatter", () => {
  it("separates the YAML header from the body", () => {
    const { data, body } = splitFrontmatter("---\ntitle: A\nn: 2\n---\n\nTexto\n");
    expect(data).toEqual({ title: "A", n: 2 });
    expect(body.trim()).toBe("Texto");
  });

  it("returns no data when there is no header", () => {
    expect(splitFrontmatter("sin cabecera").data).toBeUndefined();
  });
});

describe("loadArticles", () => {
  it("parses valid articles with the file name as slug", () => {
    const dir = folder({ "vender-mi-piso.md": `---\n${FRONTMATTER}\n---\n\nCuerpo.\n` });
    const { articles, errors } = loadArticles(dir);
    expect(errors).toEqual([]);
    expect(articles).toHaveLength(1);
    expect(articles[0]?.slug).toBe("vender-mi-piso");
    expect(articles[0]?.body.trim()).toBe("Cuerpo.");
    expect(articles[0]?.data.date).toBeInstanceOf(Date);
  });

  it("reports schema failures per file instead of throwing", () => {
    const dir = folder({
      "roto.md": `---\n${FRONTMATTER.replace("status: borrador", "status: nope")}\n---\nx`,
    });
    const { articles, errors } = loadArticles(dir);
    expect(articles).toEqual([]);
    expect(errors[0]?.slug).toBe("roto");
    expect(errors[0]?.issues.length).toBeGreaterThan(0);
  });

  it("reports a missing header and ignores non-markdown files and an empty folder", () => {
    const dir = folder({ "sin.md": "texto", "nota.txt": "x" });
    expect(loadArticles(dir).errors.map((error) => error.slug)).toEqual(["sin"]);
    const empty = mkdtempSync(path.join(tmpdir(), "blog-empty-"));
    expect(loadArticles(empty)).toEqual({ articles: [], errors: [] });
    mkdirSync(path.join(empty, "sub"));
    expect(loadArticles(empty).articles).toEqual([]);
  });
});
