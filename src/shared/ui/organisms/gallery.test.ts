import { describe, expect, it } from "vitest";
import { preloadOrder, stepIndex } from "./gallery";

describe("preloadOrder", () => {
  it("lists every slide by distance from the current one, next before previous", () => {
    expect(preloadOrder(0, 5)).toEqual([0, 1, 4, 2, 3]);
    expect(preloadOrder(3, 6)).toEqual([3, 4, 2, 5, 1, 0]);
  });

  it("wraps around the ends without repeating slides", () => {
    expect(preloadOrder(2, 3)).toEqual([2, 0, 1]);
    expect(preloadOrder(1, 2)).toEqual([1, 0]);
  });

  it("handles single-photo and empty galleries", () => {
    expect(preloadOrder(0, 1)).toEqual([0]);
    expect(preloadOrder(0, 0)).toEqual([]);
  });
});

describe("stepIndex", () => {
  it("moves forward and backward, wrapping at both ends", () => {
    expect(stepIndex(0, 1, 4)).toBe(1);
    expect(stepIndex(3, 1, 4)).toBe(0);
    expect(stepIndex(0, -1, 4)).toBe(3);
  });

  it("stays at 0 for empty or single-photo galleries", () => {
    expect(stepIndex(0, 1, 1)).toBe(0);
    expect(stepIndex(0, -1, 0)).toBe(0);
  });
});
