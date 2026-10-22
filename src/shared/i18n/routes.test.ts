import { describe, expect, it } from "vitest";
import { LOCALES } from "./config";
import { getAlternates, getLocalizedPath, ROUTE_KEYS, routes, withUrlExtras } from "./routes";

describe("getLocalizedPath", () => {
  it("returns the prefixed home path for every locale without trailing slash", () => {
    expect(LOCALES.map((locale) => getLocalizedPath("home", locale))).toEqual([
      "/es",
      "/en",
      "/it",
      "/ca",
    ]);
  });

  it.each([
    ["sale", { es: "/es/venta", en: "/en/sale", it: "/it/vendita", ca: "/ca/venda" }],
    ["rent", { es: "/es/alquiler", en: "/en/rent", it: "/it/affitto", ca: "/ca/lloguer" }],
    [
      "living",
      {
        es: "/es/vivir-en-barcelona",
        en: "/en/living-in-barcelona",
        it: "/it/vivere-a-barcellona",
        ca: "/ca/viure-a-barcelona",
      },
    ],
    ["about", { es: "/es/nosotros", en: "/en/about-us", it: "/it/chi-siamo", ca: "/ca/qui-som" }],
    [
      "cookies",
      { es: "/es/cookies", en: "/en/cookie-policy", it: "/it/cookie", ca: "/ca/galetes" },
    ],
    [
      "customSearch",
      {
        es: "/es/busqueda-a-medida",
        en: "/en/property-search-service",
        it: "/it/ricerca-su-misura",
        ca: "/ca/cerca-a-mida",
      },
    ],
    ["dataSources", { es: "/es/datos", en: "/en/data", it: "/it/dati", ca: "/ca/dades" }],
  ] as const)("translates the %s segments for the 4 locales", (key, expected) => {
    for (const locale of LOCALES) {
      expect(getLocalizedPath(key, locale)).toBe(expected[locale]);
    }
  });

  it("fills the property detail slug and ref params", () => {
    const params = { slug: "piso-luminoso-eixample", ref: "hs1234" };
    expect(getLocalizedPath("saleDetail", "es", params)).toBe(
      "/es/venta/piso-luminoso-eixample-hs1234",
    );
    expect(getLocalizedPath("saleDetail", "it", params)).toBe(
      "/it/vendita/piso-luminoso-eixample-hs1234",
    );
    expect(getLocalizedPath("rentDetail", "ca", params)).toBe(
      "/ca/lloguer/piso-luminoso-eixample-hs1234",
    );
  });

  it("fills nested district and barrio params", () => {
    expect(getLocalizedPath("barrio", "en", { district: "gracia", barrio: "vila-de-gracia" })).toBe(
      "/en/living-in-barcelona/gracia/vila-de-gracia",
    );
    expect(getLocalizedPath("municipality", "it", { municipio: "sitges" })).toBe(
      "/it/provincia-di-barcellona/sitges",
    );
    expect(getLocalizedPath("serviceDetail", "ca", { service: "lloguer-i-gestio" })).toBe(
      "/ca/serveis/lloguer-i-gestio",
    );
    expect(getLocalizedPath("blogPost", "es", { slug: "comprar-en-barcelona" })).toBe(
      "/es/blog/comprar-en-barcelona",
    );
  });

  it("rejects params that are not lowercase ASCII slugs", () => {
    expect(() => getLocalizedPath("blogPost", "es", { slug: "Gràcia" })).toThrow(RangeError);
    expect(() => getLocalizedPath("blogPost", "es", { slug: "" })).toThrow(RangeError);
    expect(() => getLocalizedPath("blogPost", "es", { slug: "a/b" })).toThrow(RangeError);
  });

  it("produces only lowercase ASCII, hyphenated paths for every route key", () => {
    for (const key of ROUTE_KEYS) {
      for (const locale of LOCALES) {
        const template = routes[key][locale];
        expect(template).toMatch(/^[a-z0-9{}/-]*$/);
        expect(template.endsWith("/")).toBe(false);
      }
    }
  });
});

describe("getAlternates", () => {
  it("returns one alternate per locale plus x-default pointing to es", () => {
    expect(getAlternates("services")).toEqual([
      { hreflang: "es-ES", locale: "es", path: "/es/servicios" },
      { hreflang: "en", locale: "en", path: "/en/services" },
      { hreflang: "it-IT", locale: "it", path: "/it/servizi" },
      { hreflang: "ca-ES", locale: "ca", path: "/ca/serveis" },
      { hreflang: "x-default", locale: "es", path: "/es/servicios" },
    ]);
  });

  it("applies the same params to every locale", () => {
    const alternates = getAlternates("saleDetail", { slug: "atico", ref: "hs9" });
    expect(alternates.map((alternate) => alternate.path)).toEqual([
      "/es/venta/atico-hs9",
      "/en/sale/atico-hs9",
      "/it/vendita/atico-hs9",
      "/ca/venda/atico-hs9",
      "/es/venta/atico-hs9",
    ]);
  });

  it("accepts per-locale params for localized slugs", () => {
    const slugs = {
      es: "piso-con-terraza",
      en: "flat-with-terrace",
      it: "appartamento",
      ca: "pis",
    };
    const alternates = getAlternates("saleDetail", (locale) => ({
      slug: slugs[locale],
      ref: "hs9",
    }));
    expect(alternates.map((alternate) => alternate.path)).toEqual([
      "/es/venta/piso-con-terraza-hs9",
      "/en/sale/flat-with-terrace-hs9",
      "/it/vendita/appartamento-hs9",
      "/ca/venda/pis-hs9",
      "/es/venta/piso-con-terraza-hs9",
    ]);
  });
});

describe("withUrlExtras", () => {
  it("appends encoded query params and a hash to a localized path", () => {
    const path = getLocalizedPath("sale", "es");
    expect(withUrlExtras(path, { query: { vista: "mapa" } })).toBe("/es/venta?vista=mapa");
    expect(withUrlExtras(path, { hash: "distritos" })).toBe("/es/venta#distritos");
    expect(withUrlExtras(path, { query: { q: "a b&c" }, hash: "x" })).toBe("/es/venta?q=a+b%26c#x");
  });

  it("returns the path untouched when there are no extras", () => {
    expect(withUrlExtras("/es", {})).toBe("/es");
  });
});
