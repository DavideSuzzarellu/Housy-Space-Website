import {
  toIsoDateTime,
  toPriceEUR,
  toPropertyRef,
  type Price,
  type Property,
} from "../domain/property";

/** Test-only factory: a minimal valid `Property` with overridable fields. */
export function makeProperty(ref = "1001", overrides: Partial<Property> = {}): Property {
  return {
    ref: toPropertyRef(ref),
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
    updatedAt: toIsoDateTime("2026-10-01T00:00:00Z"),
    ...overrides,
  };
}

export function amount(value: number): Price {
  return { kind: "amount", amount: toPriceEUR(value) };
}

export function approximateIn(zone: string): Property["location"] {
  return {
    latitude: 41.4,
    longitude: 2.17,
    radiusM: 250,
    zone,
    city: "Barcelona",
  };
}
