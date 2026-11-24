import { describe, expect, it } from "vitest";
import { isHistoryDirection } from "./scrollRestore";

describe("isHistoryDirection", () => {
  it("is true for the browser's back/forward traversals", () => {
    expect(isHistoryDirection("back")).toBe(true);
    expect(isHistoryDirection("forward")).toBe(true);
  });

  it("is false for link clicks and unknown values (they start at the top)", () => {
    expect(isHistoryDirection("")).toBe(false);
    expect(isHistoryDirection("replace")).toBe(false);
  });
});
