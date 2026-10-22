import { describe, expect, it } from "vitest";
import { amount, approximateIn, makeProperty } from "../testing/makeProperty";
import {
  DEFAULT_CATALOG_FILTERS,
  filterCatalog,
  matchesCatalogFilters,
  sortCatalog,
  toCatalogItem,
  type CatalogFilters,
  type CatalogItem,
} from "./catalog";
import { toAreaM2, toIsoDateTime } from "./property";

const flat = toCatalogItem(
  makeProperty("a1", {
    prices: { sale: amount(300000) },
    builtArea: toAreaM2(80),
    bedrooms: 3,
    bathrooms: 1,
    propertyType: { es: "Pisos", en: "Flats" },
    location: approximateIn("El Clot"),
    features: ["lift", "terrace"],
    updatedAt: toIsoDateTime("2026-10-02T00:00:00Z"),
  }),
  "sale",
);
const penthouse = toCatalogItem(
  makeProperty("b2", {
    prices: { sale: amount(900000) },
    builtArea: toAreaM2(140),
    bedrooms: 4,
    bathrooms: 2,
    propertyType: { es: "Áticos" },
    location: approximateIn("Gràcia"),
    features: ["lift"],
    updatedAt: toIsoDateTime("2026-10-05T00:00:00Z"),
  }),
  "sale",
);
const onRequest = toCatalogItem(
  makeProperty("c3", {
    prices: { sale: { kind: "onRequest" } },
    updatedAt: toIsoDateTime("2026-10-01T00:00:00Z"),
  }),
  "sale",
);
const items: readonly CatalogItem[] = [flat, penthouse, onRequest];

function filters(overrides: Partial<CatalogFilters>): CatalogFilters {
  return { ...DEFAULT_CATALOG_FILTERS, ...overrides };
}

const refs = (list: readonly CatalogItem[]) => list.map((item) => item.ref);
const matching = (overrides: Partial<CatalogFilters>) =>
  refs(items.filter((item) => matchesCatalogFilters(item, filters(overrides))));

describe("toCatalogItem", () => {
  it("projects the facts the catalog filters on, with slug keys for zone and type", () => {
    expect(flat).toEqual({
      ref: "a1",
      price: 300000,
      area: 80,
      bedrooms: 3,
      bathrooms: 1,
      typeKey: "pisos",
      zoneKey: "el-clot",
      location: { latitude: 41.4, longitude: 2.17, radiusM: 250 },
      features: ["lift", "terrace"],
      updatedAt: "2026-10-02T00:00:00.000Z",
    });
    expect(penthouse.typeKey).toBe("aticos");
    expect(penthouse.zoneKey).toBe("gracia");
  });

  it("never exposes a price that is on request", () => {
    expect(onRequest.price).toBeUndefined();
  });

  it("uses the price of the requested operation only", () => {
    const both = makeProperty("d4", {
      operations: ["sale", "rent"],
      prices: { sale: amount(500000), rent: amount(1800) },
    });
    expect(toCatalogItem(both, "rent").price).toBe(1800);
  });
});

describe("matchesCatalogFilters", () => {
  it("accepts everything with the default filters", () => {
    expect(matching({})).toEqual(["a1", "b2", "c3"]);
  });

  it("filters by zone, type, minimum rooms and required features", () => {
    expect(matching({ zone: "gracia" })).toEqual(["b2"]);
    expect(matching({ type: "pisos" })).toEqual(["a1"]);
    expect(matching({ bedrooms: 4 })).toEqual(["b2"]);
    expect(matching({ bathrooms: 2 })).toEqual(["b2"]);
    expect(matching({ features: ["terrace"] })).toEqual(["a1"]);
  });

  it("filters by the visible map area (zone centre inside the bounds)", () => {
    // approximateIn() puts every zone centre at 41.4, 2.17; c3 has no location.
    expect(matching({ bounds: { south: 41.3, west: 2.1, north: 41.5, east: 2.2 } })).toEqual([
      "a1",
      "b2",
    ]);
    expect(matching({ bounds: { south: 41.45, west: 2.1, north: 41.5, east: 2.2 } })).toEqual([]);
  });

  it("filters by price and area ranges, excluding unknown values once a bound is set", () => {
    expect(matching({ priceMin: 200000, priceMax: 500000 })).toEqual(["a1"]);
    expect(matching({ areaMin: 100 })).toEqual(["b2"]);
    expect(matching({ areaMax: 100 })).toEqual(["a1"]);
  });
});

describe("sortCatalog", () => {
  it("sorts by most recent first", () => {
    expect(refs(sortCatalog(items, "recent"))).toEqual(["b2", "a1", "c3"]);
  });

  it("sorts by price both ways, with prices on request always last", () => {
    expect(refs(sortCatalog(items, "priceAsc"))).toEqual(["a1", "b2", "c3"]);
    expect(refs(sortCatalog(items, "priceDesc"))).toEqual(["b2", "a1", "c3"]);
  });

  it("sorts by area, largest first", () => {
    expect(refs(sortCatalog(items, "area"))).toEqual(["b2", "a1", "c3"]);
  });

  it("does not mutate its input", () => {
    const input = [...items];
    sortCatalog(input, "priceAsc");
    expect(refs(input)).toEqual(["a1", "b2", "c3"]);
  });
});

describe("filterCatalog", () => {
  it("filters and then sorts", () => {
    expect(refs(filterCatalog(items, filters({ features: ["lift"], sort: "priceAsc" })))).toEqual([
      "a1",
      "b2",
    ]);
  });
});
