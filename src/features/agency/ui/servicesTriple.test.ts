import { describe, expect, it } from "vitest";
import { startAfterArrow, startAfterTab } from "./servicesTriple";

describe("services accordion of three", () => {
  it("opens a clicked tab after the window as the last open card", () => {
    expect(startAfterTab(5, 0, 8)).toBe(3);
  });

  it("opens a clicked tab before the window as the first open card", () => {
    expect(startAfterTab(1, 3, 8)).toBe(1);
  });

  it("never leaves fewer than three cards open at the end", () => {
    expect(startAfterTab(7, 0, 8)).toBe(5);
  });

  it("pages by three with the arrows and wraps around", () => {
    expect(startAfterArrow("next", 0, 8)).toBe(3);
    expect(startAfterArrow("next", 3, 8)).toBe(5);
    expect(startAfterArrow("next", 5, 8)).toBe(0);
    expect(startAfterArrow("prev", 0, 8)).toBe(5);
    expect(startAfterArrow("prev", 5, 8)).toBe(2);
  });
});
