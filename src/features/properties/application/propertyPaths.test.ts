import { describe, expect, it } from "vitest";
import { toIsoDateTime, toPropertyRef, type Property } from "../domain/property";
import {
  getDetailRouteParams,
  getListingPath,
  getListingRouteParams,
  getPropertyAlternates,
  getPropertyDetailPath,
  getPropertySlug,
} from "./propertyPaths";

function property(overrides: Partial<Property> = {}): Property {
  return {
    ref: toPropertyRef("1001"),
    operations: ["sale"],
    prices: {},
    status: "available",
    featured: false,
    title: {},
    summary: {
      es: "Piso en venta en Barcelona, con 80 m².",
      en: "Flat for sale in Barcelona.",
      ca: "Pis en venda a Barcelona, amb 80 m².",
    },
    description: {},
    propertyType: { es: "Pisos" },
    condition: {},
    features: [],
    photos: [],
    updatedAt: toIsoDateTime("2026-10-01T00:00:00Z"),
    ...overrides,
  };
}

describe("getPropertySlug", () => {
  it("slugifies the localized display title (max ~60 chars)", () => {
    expect(getPropertySlug(property(), "es")).toBe("piso-en-venta-en-barcelona");
    expect(getPropertySlug(property(), "en")).toBe("flat-for-sale-in-barcelona");
    const long = property({ title: { es: "Magnífico ".repeat(12) } });
    expect(getPropertySlug(long, "es").length).toBeLessThanOrEqual(60);
  });

  it("falls back to the property type when there is no title or summary", () => {
    expect(getPropertySlug(property({ summary: {} }), "es")).toBe("pisos");
  });
});

describe("getPropertyDetailPath", () => {
  it("builds the sale detail URL with slug and ref", () => {
    expect(getPropertyDetailPath(property(), "es")).toBe(
      "/es/venta/piso-en-venta-en-barcelona-1001",
    );
    expect(getPropertyDetailPath(property(), "it")).toBe(
      "/it/vendita/piso-en-venta-en-barcelona-1001",
    );
  });

  it("uses the rent detail route for rentals", () => {
    expect(getPropertyDetailPath(property({ operations: ["rent"] }), "ca")).toBe(
      "/ca/lloguer/pis-en-venda-a-barcelona-1001",
    );
  });

  it("returns undefined for operations without a public listing (transfer only)", () => {
    expect(getPropertyDetailPath(property({ operations: ["transfer"] }), "es")).toBeUndefined();
  });
});

describe("getPropertyDetailPath for a given operation", () => {
  const both = property({ operations: ["sale", "rent"] });

  it("builds one canonical URL per operation", () => {
    expect(getPropertyDetailPath(both, "en", "sale")).toBe(
      "/en/sale/flat-for-sale-in-barcelona-1001",
    );
    expect(getPropertyDetailPath(both, "en", "rent")).toBe(
      "/en/rent/flat-for-sale-in-barcelona-1001",
    );
  });

  it("returns undefined when the property is not listed for that operation", () => {
    expect(getPropertyDetailPath(property(), "es", "rent")).toBeUndefined();
  });
});

describe("getDetailRouteParams", () => {
  it("splits the localized detail path into the page route params", () => {
    expect(getDetailRouteParams(property(), "sale", "ca")).toEqual({
      locale: "ca",
      listing: "venda",
      detail: "pis-en-venda-a-barcelona-1001",
    });
  });

  it("round-trips with getPropertyDetailPath in every locale and operation", () => {
    const both = property({ operations: ["sale", "rent"], ref: toPropertyRef("HS-12") });
    for (const locale of ["es", "en", "it", "ca"] as const) {
      for (const operation of ["sale", "rent"] as const) {
        const { locale: prefix, listing, detail } = getDetailRouteParams(both, operation, locale);
        expect(`/${prefix}/${listing}/${detail}`).toBe(
          getPropertyDetailPath(both, locale, operation),
        );
        expect(detail.endsWith("-hs-12")).toBe(true);
      }
    }
  });
});

describe("getListingRouteParams", () => {
  it("returns the translated listing segment of each operation", () => {
    expect(getListingRouteParams("sale", "it")).toEqual({ locale: "it", listing: "vendita" });
    expect(getListingRouteParams("rent", "ca")).toEqual({ locale: "ca", listing: "lloguer" });
  });

  it("round-trips with getLocalizedPath in every locale and operation", () => {
    for (const locale of ["es", "en", "it", "ca"] as const) {
      for (const operation of ["sale", "rent"] as const) {
        const { locale: prefix, listing } = getListingRouteParams(operation, locale);
        expect(`/${prefix}/${listing}`).toBe(getListingPath(operation, locale));
      }
    }
  });
});

describe("getPropertyAlternates", () => {
  it("links the 4 localized slugs of the same property/operation plus x-default", () => {
    const alternates = getPropertyAlternates(property(), "sale");
    expect(alternates.map((alternate) => [alternate.hreflang, alternate.path])).toEqual([
      ["es-ES", "/es/venta/piso-en-venta-en-barcelona-1001"],
      ["en", "/en/sale/flat-for-sale-in-barcelona-1001"],
      ["it-IT", "/it/vendita/piso-en-venta-en-barcelona-1001"],
      ["ca-ES", "/ca/venda/pis-en-venda-a-barcelona-1001"],
      ["x-default", "/es/venta/piso-en-venta-en-barcelona-1001"],
    ]);
  });
});
