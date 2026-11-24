import { describe, expect, it } from "vitest";
import { blockPath, DESKTOP_GRID, gridShapes, MOBILE_GRID, parseRows } from "./streetGrid";

describe("street grid geometry", () => {
  it("builds the first block exactly like the reference path", () => {
    expect(blockPath(0, 0)).toBe("M25 10H95L110 25V95L95 110H25L10 95V25Z");
    expect(blockPath(1, 2)).toBe("M145 250H215L230 265V335L215 350H145L130 335V265Z");
  });

  it("parses delays and courtyard markers", () => {
    expect(parseRows(["1.16* 0.9"])).toEqual([
      [
        { delay: 1.16, courtyard: true },
        { delay: 0.9, courtyard: false },
      ],
    ]);
    expect(() => parseRows(["x"])).toThrow();
  });

  it("draws every block of both grids and a courtyard after its block", () => {
    const desktop = gridShapes(DESKTOP_GRID.rows);
    expect(desktop.filter((s) => s.kind === "block")).toHaveLength(66);
    expect(desktop.filter((s) => s.kind === "courtyard")).toHaveLength(26);
    expect(desktop[1]).toEqual({
      kind: "courtyard",
      d: "M44 36H76L84 44V76L76 84H44L36 76V44Z",
      delay: 1.66,
    });
    const mobile = gridShapes(MOBILE_GRID.rows);
    expect(mobile.filter((s) => s.kind === "block")).toHaveLength(40);
    expect(mobile.filter((s) => s.kind === "courtyard")).toHaveLength(17);
  });
});
