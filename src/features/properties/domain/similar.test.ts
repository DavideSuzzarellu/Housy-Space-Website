import { describe, expect, it } from "vitest";
import { amount, approximateIn, makeProperty } from "../testing/makeProperty";
import { toIsoDateTime } from "./property";
import { selectSimilar } from "./similar";

const current = makeProperty("100", {
  prices: { sale: amount(400000) },
  location: approximateIn("El Clot"),
});

const refs = (properties: readonly { ref: string }[]): string[] =>
  properties.map((property) => property.ref);

describe("selectSimilar", () => {
  it("never includes the current property and keeps only the same operation", () => {
    const candidates = [
      current,
      makeProperty("200", { operations: ["rent"], prices: { rent: amount(1200) } }),
      makeProperty("300", { prices: { sale: amount(390000) } }),
    ];
    expect(refs(selectSimilar(current, candidates, "sale"))).toEqual(["300"]);
  });

  it("prefers the same zone, then the closest price", () => {
    const candidates = [
      makeProperty("a", { prices: { sale: amount(401000) }, location: approximateIn("Gràcia") }),
      makeProperty("b", { prices: { sale: amount(900000) }, location: approximateIn("el clot") }),
      makeProperty("c", { prices: { sale: amount(420000) }, location: approximateIn("El Clot") }),
      makeProperty("d", { prices: { sale: amount(350000) }, location: approximateIn("Sants") }),
    ];
    expect(refs(selectSimilar(current, candidates, "sale"))).toEqual(["c", "b", "a"]);
  });

  it("ranks listings without a public price after priced ones, newest first", () => {
    const candidates = [
      makeProperty("old", {
        prices: { sale: { kind: "onRequest" } },
        updatedAt: toIsoDateTime("2026-01-01T00:00:00Z"),
      }),
      makeProperty("new", {
        prices: {},
        updatedAt: toIsoDateTime("2026-09-01T00:00:00Z"),
      }),
      makeProperty("priced", { prices: { sale: amount(2000000) } }),
    ];
    expect(refs(selectSimilar(current, candidates, "sale"))).toEqual(["priced", "new", "old"]);
  });

  it("respects the limit and never repeats a ref (unique transition names per page)", () => {
    const twin = makeProperty("300", { prices: { sale: amount(400000) } });
    const candidates = [
      twin,
      twin,
      makeProperty("400", { prices: { sale: amount(410000) } }),
      makeProperty("500", { prices: { sale: amount(420000) } }),
      makeProperty("600", { prices: { sale: amount(430000) } }),
    ];
    const similar = selectSimilar(current, candidates, "sale", 3);
    expect(refs(similar)).toEqual(["300", "400", "500"]);
    expect(new Set([current.ref, ...refs(similar)]).size).toBe(similar.length + 1);
  });
});
