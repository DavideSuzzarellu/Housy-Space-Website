import { describe, expect, it } from "vitest";
import { countAt } from "./statsCount";

describe("countAt", () => {
  it("starts at 0 and ends exactly on the target", () => {
    expect(countAt(35, 0, 1400)).toBe(0);
    expect(countAt(35, 1400, 1400)).toBe(35);
    expect(countAt(35, 5000, 1400)).toBe(35);
  });

  it("eases out: more than half way after half the time, never decreasing", () => {
    expect(countAt(100, 700, 1400)).toBe(88);
    let last = 0;
    for (let t = 0; t <= 1400; t += 50) {
      const value = countAt(60, t, 1400);
      expect(value).toBeGreaterThanOrEqual(last);
      last = value;
    }
  });

  it("clamps negative time and handles a zero duration", () => {
    expect(countAt(9, -10, 1400)).toBe(0);
    expect(countAt(9, 0, 0)).toBe(9);
  });
});
