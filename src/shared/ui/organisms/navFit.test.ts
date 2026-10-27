import { describe, expect, it } from "vitest";
import { chooseNavMode, NAV_DENSITIES } from "./navFit";

const widths = { full: 900, tight: 820, xtight: 760 } as const;

describe("chooseNavMode", () => {
  it("keeps the roomiest density that fits the space the header leaves the menu", () => {
    expect(chooseNavMode(1000, widths)).toBe("full");
    expect(chooseNavMode(900, widths)).toBe("full");
    expect(chooseNavMode(850, widths)).toBe("tight");
    expect(chooseNavMode(780, widths)).toBe("xtight");
  });

  it("falls back to the compact menu button when no density fits (never clips the menu)", () => {
    expect(chooseNavMode(759, widths)).toBe("compact");
    expect(chooseNavMode(0, widths)).toBe("compact");
  });

  it("tries densities from roomiest to tightest", () => {
    expect(NAV_DENSITIES).toEqual(["full", "tight", "xtight"]);
  });
});
