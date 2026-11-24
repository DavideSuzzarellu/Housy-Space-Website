import { describe, expect, it } from "vitest";
import { auditRedirects, auditSite, parseHead } from "./headAudit";

const HREFLANGS = ["es-ES", "en"] as const;
const OPTIONS = { hreflangs: HREFLANGS };
const ES = "https://h.example/es/a";
const EN = "https://h.example/en/a";

interface PageOptions {
  readonly lang: string;
  readonly canonical: string;
  readonly alternates: readonly (readonly [string, string])[];
  readonly extra?: string;
  readonly h1?: number;
}

function page(file: string, options: PageOptions): ReturnType<typeof parseHead> {
  const links = options.alternates
    .map(([hreflang, href]) => `<link rel="alternate" hreflang="${hreflang}" href="${href}">`)
    .join("");
  const html = `<!doctype html><html lang="${options.lang}"><head><title>T &amp; U</title>
<meta name="description" content="D"><link rel="canonical" href="${options.canonical}">${links}
<meta property="og:image" content="https://h.example/og.png">${options.extra ?? ""}</head>
<body>${"<h1>x</h1>".repeat(options.h1 ?? 1)}</body></html>`;
  return parseHead(file, html);
}

const GOOD = [
  ["es-ES", ES],
  ["en", EN],
  ["x-default", ES],
] as const;
const es = () => page("es/a", { lang: "es-ES", canonical: ES, alternates: GOOD });
const en = () => page("en/a", { lang: "en", canonical: EN, alternates: GOOD });

describe("parseHead", () => {
  it("reads title, description, canonical, alternates, og:image and JSON-LD", () => {
    const parsed = page("es/a", {
      lang: "es-ES",
      canonical: ES,
      alternates: GOOD,
      extra: '<script type="application/ld+json">{"@type":"WebPage"}</script>',
    });
    expect(parsed).toMatchObject({
      lang: "es-ES",
      title: "T & U",
      description: "D",
      canonical: ES,
      ogImage: "https://h.example/og.png",
      h1Count: 1,
      jsonLd: [{ "@type": "WebPage" }],
    });
    expect(parsed.alternates).toHaveLength(3);
  });

  it("flags a JSON-LD block that does not parse", () => {
    const broken = page("es/a", {
      lang: "es-ES",
      canonical: ES,
      alternates: GOOD,
      extra: '<script type="application/ld+json">{oops</script>',
    });
    expect(auditSite([broken, en()], OPTIONS).join()).toContain("does not parse");
  });
});

describe("auditSite", () => {
  it("accepts reciprocal alternates", () => {
    expect(auditSite([es(), en()], OPTIONS)).toEqual([]);
  });

  it("fails when an alternate does not list the page back", () => {
    const lonely = page("en/a", {
      lang: "en",
      canonical: EN,
      alternates: [
        ["en", EN],
        ["es-ES", "https://h.example/es/other"],
        ["x-default", "https://h.example/es/other"],
      ],
    });
    expect(auditSite([es(), lonely], OPTIONS).length).toBeGreaterThan(0);
  });

  it("fails when a locale or x-default is missing", () => {
    const partial = page("es/a", {
      lang: "es-ES",
      canonical: ES,
      alternates: [["es-ES", ES]],
    });
    const problems = auditSite([partial], OPTIONS).join("\n");
    expect(problems).toContain("missing hreflang en");
    expect(problems).toContain("missing hreflang x-default");
  });

  it("fails when the canonical is not one of the page's own alternates", () => {
    const wrong = page("es/a", {
      lang: "es-ES",
      canonical: "https://h.example/es/z",
      alternates: GOOD,
    });
    expect(auditSite([wrong, en()], OPTIONS).join()).toContain("own hreflang alternates");
  });

  it("fails on a missing or repeated H1", () => {
    expect(
      auditSite(
        [page("es/a", { lang: "es-ES", canonical: ES, alternates: GOOD, h1: 2 }), en()],
        OPTIONS,
      ).join(),
    ).toContain("found 2");
  });

  it("ignores noindex pages", () => {
    const hidden = page("es/b", {
      lang: "es-ES",
      canonical: "https://h.example/es/b",
      alternates: [],
      extra: '<meta name="robots" content="noindex,follow">',
    });
    expect(auditSite([es(), en(), hidden], OPTIONS)).toEqual([]);
  });
});

describe("auditRedirects", () => {
  it("requires noindex and a canonical on meta-refresh pages", () => {
    const refresh = parseHead(
      "old/index.html",
      '<html><head><meta http-equiv="refresh" content="0;url=/es/a"></head></html>',
    );
    expect(auditRedirects([refresh])).toHaveLength(2);
    const ok = parseHead(
      "old/index.html",
      '<html><head><meta http-equiv="refresh" content="0;url=/es/a"><meta name="robots" content="noindex"><link rel="canonical" href="https://h.example/es/a"></head></html>',
    );
    expect(auditRedirects([ok])).toEqual([]);
  });
});
