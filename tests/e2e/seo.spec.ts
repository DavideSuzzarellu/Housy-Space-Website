import { expect, test, type Page } from "@playwright/test";

/**
 * Head tags of the built site in the 4 locales: title, description, canonical, reciprocal
 * hreflang, Open Graph, robots and JSON-LD. The base comes from `ASTRO_BASE`, the same variable
 * that builds the site (`playwright.config.ts` sets it; "/" is the site root).
 */
const BASE = (process.env["ASTRO_BASE"] ?? "/").replace(/\/$/, "");

const LOCALES = [
  { locale: "es", lang: "es-ES" },
  { locale: "en", lang: "en" },
  { locale: "it", lang: "it-IT" },
  { locale: "ca", lang: "ca-ES" },
] as const;
type Locale = (typeof LOCALES)[number]["locale"];

/** One page of each template per locale: home, listing, service, services index, district, barrio, contact. */
const PAGES: Record<Locale, Record<string, string>> = {
  es: {
    home: "/es",
    listing: "/es/venta",
    services: "/es/servicios",
    service: "/es/servicios/valoracion",
    district: "/es/zonas/barcelona/distritos/gracia",
    barrio: "/es/zonas/barcelona/el-raval",
    contact: "/es/contacto",
  },
  en: {
    home: "/en",
    listing: "/en/sale",
    services: "/en/services",
    service: "/en/services/property-valuation",
    district: "/en/zones/barcelona/districts/gracia",
    barrio: "/en/zones/barcelona/el-raval",
    contact: "/en/contact",
  },
  it: {
    home: "/it",
    listing: "/it/vendita",
    services: "/it/servizi",
    service: "/it/servizi/valutazione-immobiliare",
    district: "/it/zone/barcelona/distretti/gracia",
    barrio: "/it/zone/barcelona/el-raval",
    contact: "/it/contatti",
  },
  ca: {
    home: "/ca",
    listing: "/ca/venda",
    services: "/ca/serveis",
    service: "/ca/serveis/valoracio-immobiliaria",
    district: "/ca/zones/barcelona/districtes/gracia",
    barrio: "/ca/zones/barcelona/el-raval",
    contact: "/ca/contacte",
  },
};

interface Head {
  readonly lang: string;
  readonly title: string;
  readonly description: string | null;
  readonly canonical: string | null;
  readonly robots: string | null;
  readonly ogImage: string | null;
  readonly alternates: readonly { hreflang: string; href: string }[];
  readonly jsonLd: readonly unknown[];
  readonly h1Count: number;
}

async function readHead(page: Page): Promise<Head> {
  return page.evaluate((): Head => {
    const attr = (selector: string, name: string): string | null =>
      document.querySelector(selector)?.getAttribute(name) ?? null;
    return {
      lang: document.documentElement.lang,
      title: document.title,
      description: attr('meta[name="description"]', "content"),
      canonical: attr('link[rel="canonical"]', "href"),
      robots: attr('meta[name="robots"]', "content"),
      ogImage: attr('meta[property="og:image"]', "content"),
      alternates: [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map((link) => ({
        hreflang: link.getAttribute("hreflang") ?? "",
        href: link.getAttribute("href") ?? "",
      })),
      jsonLd: [...document.querySelectorAll('script[type="application/ld+json"]')].map(
        (script): unknown => JSON.parse(script.textContent ?? "null"),
      ),
      h1Count: document.querySelectorAll("h1").length,
    };
  });
}

/** `@type` of every node of every JSON-LD block. */
function typesOf(blocks: readonly unknown[]): string[] {
  return blocks.flatMap((block) => {
    if (typeof block !== "object" || block === null) return [];
    const graph: unknown = "@graph" in block ? block["@graph"] : [block];
    return Array.isArray(graph)
      ? graph.flatMap((node: unknown) =>
          typeof node === "object" && node !== null && "@type" in node
            ? [String(node["@type"])]
            : [],
        )
      : [];
  });
}

for (const { locale, lang } of LOCALES) {
  for (const [template, path] of Object.entries(PAGES[locale])) {
    test(`${locale} ${template}: complete, self-referencing head`, async ({ page }) => {
      await page.goto(`${BASE}${path}`);
      const head = await readHead(page);
      expect(head.lang).toBe(lang);
      expect(head.title).toContain("HousySpace");
      expect(head.description?.length ?? 0).toBeGreaterThan(40);
      expect(head.h1Count).toBe(1);
      expect(head.robots).toBeNull();
      expect(head.ogImage).toMatch(/^https?:\/\//);
      // Canonical is absolute, ends with this page's path and is one of its own hreflang alternates.
      expect(head.canonical).toMatch(/^https?:\/\//);
      expect(new URL(head.canonical ?? "").pathname).toBe(`${BASE}${path}`);
      expect(head.alternates.map((alternate) => alternate.hreflang).sort()).toEqual(
        ["ca-ES", "en", "es-ES", "it-IT", "x-default"].sort(),
      );
      expect(head.alternates.find((alternate) => alternate.hreflang === lang)?.href).toBe(
        head.canonical,
      );
      // x-default is the Spanish version.
      expect(
        new URL(head.alternates.find((alternate) => alternate.hreflang === "x-default")?.href ?? "")
          .pathname,
      ).toMatch(new RegExp(`^${BASE}/es(/|$)`));

      const types = typesOf(head.jsonLd);
      expect(head.jsonLd.length).toBeGreaterThan(0);
      if (template === "home") expect(types).toEqual(["RealEstateAgent", "WebSite"]);
      else expect(types).toContain("BreadcrumbList");
      if (template === "service") expect(types).toContain("Service");
      if (template === "district" || template === "barrio") {
        expect(types).toContain("AdministrativeArea");
      }
      // Never claim what the site cannot show, and never expose a location.
      const raw = JSON.stringify(head.jsonLd);
      for (const forbidden of ['"aggregateRating"', '"review"', '"geo"', '"telephone"']) {
        expect(raw).not.toContain(forbidden);
      }
    });
  }

  test(`${locale} services: every alternate lists the page back`, async ({ page, request }) => {
    await page.goto(`${BASE}${PAGES[locale]["services"]}`);
    const { alternates, canonical } = await readHead(page);
    for (const alternate of alternates) {
      const response = await request.get(alternate.href.replace(/^https?:\/\/[^/]+/, ""));
      expect(response.status()).toBe(200);
      const html = await response.text();
      expect(html).toContain(`hreflang="${lang}" href="${canonical}"`);
    }
  });
}

test("a retired URL is noindex, canonical to its destination and offers a visible link", async ({
  request,
}) => {
  // The browser would follow the meta refresh, so read the served HTML.
  const html = await (await request.get(`${BASE}/es/vender`)).text();
  const destination = `${BASE}/es/servicios/venta-estrategica`;
  expect(html).toMatch(/<meta name="robots" content="noindex/);
  expect(html).toMatch(new RegExp(`<link rel="canonical" href="https?://[^"]+${destination}"`));
  expect(html).toContain(`<a href="${destination}"`);
});

test("the data sources page stays out of the index", async ({ page }) => {
  await page.goto(`${BASE}/es/datos`);
  expect((await readHead(page)).robots).toContain("noindex");
});

test("robots.txt points to the sitemap index and the sitemap carries translated alternates", async ({
  request,
}) => {
  const robots = await (await request.get(`${BASE}/robots.txt`)).text();
  expect(robots).toMatch(/^Sitemap: https?:\/\/\S+\/sitemap-index\.xml$/m);
  expect(robots).not.toMatch(/^Disallow: \/(_astro|brand|media)?\/?$/m);
  const sitemap = await (await request.get(`${BASE}/sitemap-0.xml`)).text();
  const entry = sitemap.split("<url>").find((url) => url.includes("/es/servicios</loc>"));
  expect(entry).toContain('hreflang="en"');
  expect(entry).toContain('/en/services"');
  expect(sitemap).not.toContain("/es/vender<");
  expect(sitemap).not.toContain("/es/datos<");
});
