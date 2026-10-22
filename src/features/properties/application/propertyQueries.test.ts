import { describe, expect, it } from "vitest";
import { toIsoDateTime, toPropertyRef, type Property } from "../domain/property";
import { createPropertyQueries } from "./propertyQueries";

function property(ref: string, overrides: Partial<Property> = {}): Property {
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

const catalog = [
  property("a", { featured: true, updatedAt: toIsoDateTime("2026-10-05T00:00:00Z") }),
  property("b", { operations: ["rent"] }),
  property("c", { operations: ["sale", "rent"], featured: true }),
];

const queries = createPropertyQueries(async () => catalog);

describe("property queries", () => {
  it("getFeaturedProperties returns featured properties up to the limit", async () => {
    expect((await queries.getFeaturedProperties()).map((p) => p.ref)).toEqual(["a", "c"]);
    expect((await queries.getFeaturedProperties({ limit: 1 })).map((p) => p.ref)).toEqual(["a"]);
  });

  it("getPropertyByRef looks up case-insensitively and returns a typed result", async () => {
    expect(await queries.getPropertyByRef("A")).toMatchObject({ ok: true, property: { ref: "a" } });
    expect(await queries.getPropertyByRef("zzz")).toEqual({ ok: false, error: "not-found" });
    expect(await queries.getPropertyByRef("  ")).toEqual({ ok: false, error: "not-found" });
  });

  it("listProperties filters by operation", async () => {
    expect((await queries.listProperties()).map((p) => p.ref)).toEqual(["a", "b", "c"]);
    expect((await queries.listProperties({ operation: "rent" })).map((p) => p.ref)).toEqual([
      "b",
      "c",
    ]);
  });
});

describe("getSimilarProperties", () => {
  it("returns other listings of the same operation, never the current one", async () => {
    const similar = await queries.getSimilarProperties("C", "rent");
    expect(similar.map((p) => p.ref)).toEqual(["b"]);
    expect(await queries.getSimilarProperties("zzz", "sale")).toEqual([]);
  });
});
