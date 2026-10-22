import { describe, expect, it } from "vitest";
import { stepIndex } from "./gallery";

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
