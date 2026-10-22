import { describe, expect, it } from "vitest";
import {
  getCoverPhoto,
  getListPrice,
  getLocationLabel,
  getPrimaryOperation,
  getPropertyTitle,
  localize,
  MAX_APPROXIMATE_OFFSET_M,
  selectFeatured,
  toApproximateCentre,
  toIsoDateTime,
  toPropertyRef,
  type Property,
} from "./property";

/** Great-circle distance in metres (haversine), independent of the code under test. */
function distanceM(a: { latitude: number; longitude: number }, b: typeof a): number {
  const rad = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * rad;
  const dLng = (b.longitude - a.longitude) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.latitude * rad) * Math.cos(b.latitude * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

describe("toApproximateCentre", () => {
  // Mobilia sends the building's own coordinates as the "zone" (seen in real responses).
  const building = { latitude: 41.410491, longitude: 2.190669 };

  it("never returns the building's coordinates", () => {
    const centre = toApproximateCentre(building);
    expect(centre).not.toEqual(building);
    expect(distanceM(centre, building)).toBeGreaterThan(0);
  });

  it("keeps the building within the maximum offset (inside any circle of that radius)", () => {
    for (let i = 0; i < 2000; i += 1) {
      const point = {
        latitude: 41.32 + ((i * 7919) % 1000) / 6000,
        longitude: 2.05 + ((i * 104729) % 1000) / 4000,
      };
      expect(distanceM(toApproximateCentre(point), point)).toBeLessThanOrEqual(
        MAX_APPROXIMATE_OFFSET_M,
      );
    }
  });

  it("is deterministic and shared by neighbours, so it cannot be averaged back to the building", () => {
    const centre = toApproximateCentre(building);
    expect(toApproximateCentre(building)).toEqual(centre);
    expect(toApproximateCentre({ latitude: 41.411, longitude: 2.1915 })).toEqual(centre);
  });
});

function makeProperty(overrides: Partial<Property> = {}): Property {
  return {
    ref: toPropertyRef("1001"),
    operations: ["sale"],
    prices: {},
    status: "available",
    featured: false,
    title: {},
    summary: {},
    description: {},
    propertyType: {},
    condition: {},
    features: [],
    photos: [],
    updatedAt: toIsoDateTime("2026-10-20T10:00:00.000Z"),
    ...overrides,
  };
}

describe("toPropertyRef", () => {
  it("trims and lowercases the Mobilia reference", () => {
    expect(toPropertyRef("  HS-1001 ")).toBe("hs-1001");
  });

  it("rejects an empty reference", () => {
    expect(() => toPropertyRef("   ")).toThrow(RangeError);
  });
});

describe("toIsoDateTime", () => {
  it("normalizes offsets to UTC ISO 8601", () => {
    expect(toIsoDateTime("2026-10-20T17:41:47.8+02:00")).toBe("2026-10-20T15:41:47.800Z");
  });

  it("rejects unparseable dates", () => {
    expect(() => toIsoDateTime("yesterday")).toThrow(RangeError);
  });
});

describe("localize", () => {
  const text = { es: "Hola", en: "Hello" };

  it("returns the requested locale when present", () => {
    expect(localize(text, "en")).toBe("Hello");
  });

  it("falls back to es, then en", () => {
    expect(localize(text, "it")).toBe("Hola");
    expect(localize({ en: "Hello" }, "ca")).toBe("Hello");
  });

  it("returns undefined when no locale has text", () => {
    expect(localize({}, "es")).toBeUndefined();
  });
});

describe("getPropertyTitle", () => {
  it("prefers the localized web title", () => {
    const property = makeProperty({ title: { es: "Ático con terraza" } });
    expect(getPropertyTitle(property, "en")).toBe("Ático con terraza");
  });

  it("falls back to the lead clause of the summary when there is no title", () => {
    const property = makeProperty({
      summary: {
        es: "Piso en venta en Barcelona, con 80 m², 3 habitaciones.",
        en: "Flat for sale in Barcelona, with 80 m².",
      },
    });
    expect(getPropertyTitle(property, "es")).toBe("Piso en venta en Barcelona");
    expect(getPropertyTitle(property, "en")).toBe("Flat for sale in Barcelona");
    expect(getPropertyTitle(property, "it")).toBe("Piso en venta en Barcelona");
  });

  it("returns undefined when neither title nor summary exist", () => {
    expect(getPropertyTitle(makeProperty(), "es")).toBeUndefined();
  });
});

describe("getPrimaryOperation and getListPrice", () => {
  it("prefers sale over rent", () => {
    const property = makeProperty({ operations: ["rent", "sale"] });
    expect(getPrimaryOperation(property)).toBe("sale");
  });

  it("returns the price of the primary operation", () => {
    const property = makeProperty({
      operations: ["rent"],
      prices: { rent: { kind: "onRequest" } },
    });
    expect(getListPrice(property)).toEqual({ operation: "rent", price: { kind: "onRequest" } });
  });

  it("returns undefined when the operation has no price", () => {
    expect(getListPrice(makeProperty())).toBeUndefined();
  });
});

describe("getCoverPhoto and getLocationLabel", () => {
  it("uses the first photo as cover", () => {
    const property = makeProperty({
      photos: [
        { url: "https://media.mobiliagestion.es/a", caption: {} },
        { url: "https://media.mobiliagestion.es/b", caption: {} },
      ],
    });
    expect(getCoverPhoto(property)?.url).toBe("https://media.mobiliagestion.es/a");
    expect(getCoverPhoto(makeProperty())).toBeUndefined();
  });

  it("joins zone and city", () => {
    const property = makeProperty({
      location: {
        latitude: 41.41,
        longitude: 2.19,
        radiusM: 250,
        zone: "El Clot",
        city: "Barcelona",
      },
    });
    expect(getLocationLabel(property)).toBe("El Clot · Barcelona");
    expect(getLocationLabel(makeProperty())).toBeUndefined();
  });
});

describe("selectFeatured", () => {
  const at = (iso: string) => toIsoDateTime(iso);
  const a = makeProperty({ ref: toPropertyRef("a"), updatedAt: at("2026-10-01T00:00:00Z") });
  const b = makeProperty({
    ref: toPropertyRef("b"),
    featured: true,
    updatedAt: at("2026-10-02T00:00:00Z"),
  });
  const c = makeProperty({
    ref: toPropertyRef("c"),
    featured: true,
    updatedAt: at("2026-10-03T00:00:00Z"),
  });
  const d = makeProperty({ ref: toPropertyRef("d"), updatedAt: at("2026-10-04T00:00:00Z") });

  it("returns featured properties, most recently updated first, up to the limit", () => {
    expect(selectFeatured([a, b, c, d], 3).map((p) => p.ref)).toEqual(["c", "b"]);
    expect(selectFeatured([a, b, c, d], 1).map((p) => p.ref)).toEqual(["c"]);
  });

  it("falls back to the latest properties when none is featured", () => {
    expect(selectFeatured([a, d], 3).map((p) => p.ref)).toEqual(["d", "a"]);
  });

  it("returns an empty list when there are no properties", () => {
    expect(selectFeatured([], 3)).toEqual([]);
  });
});
