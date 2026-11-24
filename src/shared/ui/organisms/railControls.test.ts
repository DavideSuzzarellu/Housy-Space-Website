import { describe, expect, it } from "vitest";
import { railEdges } from "./railControls";

describe("railEdges", () => {
  it("is at the start before any scroll", () => {
    expect(railEdges(0, 400, 1200)).toEqual({ atStart: true, atEnd: false });
  });

  it("is at neither end in the middle", () => {
    expect(railEdges(300, 400, 1200)).toEqual({ atStart: false, atEnd: false });
  });

  it("is at the end within the sub-pixel tolerance", () => {
    expect(railEdges(799, 400, 1200)).toEqual({ atStart: false, atEnd: true });
  });

  it("is at both ends when nothing overflows", () => {
    expect(railEdges(0, 400, 400)).toEqual({ atStart: true, atEnd: true });
  });
});
