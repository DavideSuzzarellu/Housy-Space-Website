import { describe, expect, it } from "vitest";
import { panelPosition, wrapIndex } from "./accordionRail";

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

describe("panelPosition", () => {
  const positions = (active: number) =>
    Array.from({ length: 9 }, (_, index) => panelPosition(index, active, 9, 3));

  it("opens the active panel in the centre with three on each side", () => {
    expect(positions(0)).toEqual([0, 1, 2, 3, "hr", "hl", -3, -2, -1]);
  });

  it("goes round the circle: after the last one comes the first", () => {
    expect(positions(8)).toEqual([1, 2, 3, "hr", "hl", -3, -2, -1, 0]);
    expect(positions(4)).toEqual(["hl", -3, -2, -1, 0, 1, 2, 3, "hr"]);
  });

  it("hides the rest on the side they would leave from", () => {
    expect(panelPosition(4, 0, 9, 3)).toBe("hr");
    expect(panelPosition(5, 0, 9, 3)).toBe("hl");
  });

  it("shows everyone when the side covers the whole circle", () => {
    expect(Array.from({ length: 4 }, (_, i) => panelPosition(i, 0, 4, 3))).toEqual([0, 1, -2, -1]);
  });
});
