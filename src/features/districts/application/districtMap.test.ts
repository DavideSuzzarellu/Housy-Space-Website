import { describe, expect, it } from "vitest";
import {
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
