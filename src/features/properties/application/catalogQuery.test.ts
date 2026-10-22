import { describe, expect, it } from "vitest";
import { DEFAULT_CATALOG_QUERY, parseCatalogQuery, serializeCatalogQuery } from "./catalogQuery";

const parse = (search: string) => parseCatalogQuery(new URLSearchParams(search));

describe("parseCatalogQuery", () => {
  it("returns the defaults for an empty query", () => {
    expect(parse("")).toEqual(DEFAULT_CATALOG_QUERY);
  });

  it("parses every supported param", () => {
    expect(
      parse(
        "zona=el-clot&tipo=pisos&pmin=100000&pmax=500000&smin=60&smax=120&hab=2&ban=1&car=lift,terrace&orden=precio-asc&vista=mapa",
      ),
    ).toEqual({
      filters: {
        zone: "el-clot",
        type: "pisos",
        priceMin: 100000,
        priceMax: 500000,
        areaMin: 60,
        areaMax: 120,
        bedrooms: 2,
        bathrooms: 1,
        features: ["lift", "terrace"],
        sort: "priceAsc",
      },
      view: "map",
    });
  });

  it("accepts features as repeated params (form submission) and drops unknown ones", () => {
    expect(parse("car=lift&car=garden&car=jacuzzi").filters.features).toEqual(["lift", "garden"]);
  });

  it("ignores invalid values one by one instead of rejecting the whole query", () => {
    expect(
      parse("zona=%3Cscript%3E&pmin=-5&pmax=abc&hab=2.5&ban=&orden=random&vista=grid&tipo=pisos"),
    ).toEqual({ filters: { ...DEFAULT_CATALOG_QUERY.filters, type: "pisos" }, view: "list" });
  });

  it("parses the map area as south,west,north,east and rejects malformed or inverted boxes", () => {
    expect(parse("mapa=41.38,2.12,41.42,2.2").filters.bounds).toEqual({
      south: 41.38,
      west: 2.12,
      north: 41.42,
      east: 2.2,
    });
    expect(parse("mapa=41.42,2.12,41.38,2.2").filters.bounds).toBeUndefined();
    expect(parse("mapa=41.38,2.12,41.42").filters.bounds).toBeUndefined();
    expect(parse("mapa=95,2.12,96,2.2").filters.bounds).toBeUndefined();
    expect(parse("mapa=a,b,c,d").filters.bounds).toBeUndefined();
  });

  it("serializes the map area with 5 decimals (~1 m)", () => {
    const query = parse("mapa=41.383333333,2.12,41.42,2.2");
    expect(serializeCatalogQuery(query).get("mapa")).toBe("41.38333,2.12000,41.42000,2.20000");
  });

  it("deduplicates features", () => {
    expect(parse("car=lift,lift").filters.features).toEqual(["lift"]);
  });
});

describe("serializeCatalogQuery", () => {
  it("omits defaults so the unfiltered listing has no query string", () => {
    expect(serializeCatalogQuery(DEFAULT_CATALOG_QUERY).toString()).toBe("");
  });

  it("round-trips through parseCatalogQuery in a stable param order", () => {
    const search = "zona=gracia&pmax=400000&hab=3&car=lift%2Cterrace&orden=superficie&vista=mixta";
    const serialized = serializeCatalogQuery(parse(search));
    expect(serialized.toString()).toBe(search);
    expect(parseCatalogQuery(serialized)).toEqual(parse(search));
  });
});
