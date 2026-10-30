import { describe, expect, it } from "vitest";
import { wrapIndex } from "./servicesAccordion";

describe("wrapIndex", () => {
  it("moves to the next panel", () => {
    expect(wrapIndex(2, 1, 8)).toBe(3);
  });

  it("wraps past the last panel to the first", () => {
    expect(wrapIndex(7, 1, 8)).toBe(0);
  });

  it("wraps before the first panel to the last", () => {
    expect(wrapIndex(0, -1, 8)).toBe(7);
  });
});
