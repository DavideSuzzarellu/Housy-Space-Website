import { describe, expect, it } from "vitest";
import {
  buildBarrioLayer,
  buildBarrioMap,
  zoomTransform,
  labelLines,
  labelFits,
  pathBounds,
  pathCentroid,
  toneOf,
  type MapViewBox,
} from "./districtMap";

describe("toneOf (quantile buckets like the reference)", () => {
  const values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  it("puts the lowest value in tone 0 and the highest in the last", () => {
    expect(toneOf(values, 10, 7)).toBe(0);
    expect(toneOf(values, 100, 7)).toBe(6);
  });
  it("never decreases as the value grows", () => {
    const tones = values.map((value) => toneOf(values, value, 7));
    expect(tones).toEqual([...tones].sort((a, b) => a - b));
    expect(new Set(tones).size).toBe(7);
  });
  it("has no tone for a missing value", () => {
    expect(toneOf(values, null, 7)).toBe(-1);
  });
});

describe("path geometry", () => {
  const square = "M0 0L10 0L10 10L0 10Z";
  it("reads the bounding box", () => {
    expect(pathBounds(square)).toEqual({ x0: 0, y0: 0, x1: 10, y1: 10 });
  });
  it("centres on the largest ring only", () => {
    const d = `${square}M100 100L102 100L102 102L100 102Z`;
    const centre = pathCentroid(d);
    expect(centre.x).toBeCloseTo(5);
    expect(centre.y).toBeCloseTo(5);
  });
  it("is not fooled by the ring direction", () => {
    const centre = pathCentroid("M0 0L0 10L10 10L10 0Z");
    expect(centre.x).toBeCloseTo(5);
  });
});

describe("labels", () => {
  it("keeps short names on one line and balances long ones on two", () => {
    expect(labelLines("Gràcia")).toEqual(["Gràcia"]);
    expect(labelLines("Sarrià-Sant Gervasi")).toEqual(["Sarrià-Sant", "Gervasi"]);
    expect(labelLines("Horta-Guinardó")).toEqual(["Horta-Guinardó"]);
  });
  const viewBox: MapViewBox = { width: 1000, height: 1148 };
  it("hides a label wider than 1.5 times its district", () => {
    const box = { x0: 0, y0: 0, x1: 100, y1: 100 };
    expect(labelFits(["Eixample"], box, viewBox, 600, 12.5)).toBe(true);
    expect(labelFits(["Sarrià-Sant", "Gervasi"], box, viewBox, 600, 12.5)).toBe(false);
  });
});

describe("buildBarrioMap", () => {
  const barrio = (slug: string, district: string, sale: number) =>
    ({ slug, name: slug, district, sale }) as never;
  const market = {
    barrios: [barrio("a", "x", 1000), barrio("b", "x", 2000), barrio("c", "y", 3000)],
  } as never;
  const shapes = {
    barrios: { a: "M0 0L10 0L10 10L0 10Z", b: "M10 0L20 0L20 10L10 10Z", c: "M50 50L60 50L60 60Z" },
  };
  it("crops to the district, numbers barrios in order and pins their centres", () => {
    const map = buildBarrioMap(market, shapes, "x");
    expect(map.barrios.map((item) => item.index)).toEqual([1, 2]);
    expect(map.viewBox).toBe("-6.0 -6.0 32.0 22.0");
    expect(map.barrios[0]?.left).toBeCloseTo(((5 + 6) / 32) * 100);
  });
  it("tones every barrio among all of them and gives the legend range", () => {
    const map = buildBarrioMap(market, shapes, "x");
    expect(map.range).toEqual({ min: 1000, max: 3000 });
    expect(map.barrios[0]?.tone).toBeLessThan(map.barrios[1]?.tone ?? 0);
  });
});

describe("zoomTransform", () => {
  const viewBox = { width: 1000, height: 1000 };
  it("centres the box and fits it with air", () => {
    const zoom = zoomTransform({ x0: 100, y0: 100, x1: 300, y1: 200 }, viewBox);
    expect(zoom.k).toBeCloseTo(4);
    expect(200 * zoom.k + zoom.tx).toBeCloseTo(500);
    expect(150 * zoom.k + zoom.ty).toBeCloseTo(500);
  });
  it("never zooms past 6x", () => {
    expect(zoomTransform({ x0: 0, y0: 0, x1: 10, y1: 10 }, viewBox).k).toBe(6);
  });
});

describe("buildBarrioLayer", () => {
  it("tones every barrio per metric among all of them", () => {
    const barrio = (slug: string, sale: number) =>
      ({ slug, name: slug, district: "x", sale, rent: sale, density: sale }) as never;
    const layer = buildBarrioLayer({ barrios: [barrio("a", 1), barrio("b", 9)] } as never, {
      barrios: { a: "M0 0L10 0L10 10Z", b: "M20 0L30 0L30 10Z" },
    });
    expect(layer.map((item) => item.slug)).toEqual(["a", "b"]);
    expect(layer[0]?.tones.sale).toBeLessThan(layer[1]?.tones.sale ?? 0);
  });
});
