import { describe, expect, it } from "vitest";
import { flatReferencePrice, percentDiff, rankOf } from "./marketStats";

// Expected values are the ones published on the Verdun page of the proposal.
describe("market stats", () => {
  it("compares against the city and the district", () => {
    expect(percentDiff(2736, 4254)).toBe(-36);
    expect(percentDiff(2736, 2952)).toBe(-7);
    expect(percentDiff(56992, 17010)).toBe(235);
  });

  it("ranks highest first and keeps ties together", () => {
    expect(rankOf(5, [9, 5, 5, 1])).toBe(2);
    expect(rankOf(9, [9, 5])).toBe(1);
  });

  it("rounds the 80 m² reference price to the thousand", () => {
    expect(flatReferencePrice(2736)).toBe(219000);
  });
});
