import { describe, expect, it } from "vitest";
import { parseHead } from "./headAudit";
import { buildSitemapXml } from "./sitemapXml";

const head = (canonical: string, extra = ""): ReturnType<typeof parseHead> =>
  parseHead(
    "x",
    `<html lang="es-ES"><head><title>t</title><link rel="canonical" href="${canonical}">
<link rel="alternate" hreflang="es-ES" href="${canonical}">
<link rel="alternate" hreflang="en" href="https://h.example/en/services">${extra}</head></html>`,
  );

describe("buildSitemapXml", () => {
  it("lists each indexable page once with the alternates of its head", () => {
    const xml = buildSitemapXml([
      head("https://h.example/es/servicios"),
      head("https://h.example/es/servicios"),
    ]);
    expect(xml.match(/<loc>/g)).toHaveLength(1);
    expect(xml).toContain(
      '<xhtml:link rel="alternate" hreflang="en" href="https://h.example/en/services"/>',
    );
  });

  it("leaves out noindex and redirect pages", () => {
    const xml = buildSitemapXml([
      head("https://h.example/es/a", '<meta name="robots" content="noindex,follow">'),
      parseHead(
        "r",
        '<html><head><meta http-equiv="refresh" content="0;url=/x"><link rel="canonical" href="https://h.example/x"></head></html>',
      ),
      head("https://h.example/es/b"),
    ]);
    expect(xml).toContain("<loc>https://h.example/es/b</loc>");
    expect(xml).not.toContain("/es/a<");
    expect(xml).not.toContain("<loc>https://h.example/x</loc>");
  });

  it("escapes ampersands in URLs", () => {
    expect(buildSitemapXml([head("https://h.example/es/a?x=1&y=2")])).toContain("x=1&amp;y=2");
  });
});
