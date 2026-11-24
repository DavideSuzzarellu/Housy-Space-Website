import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("src/styles/global.css", "utf8");
const token = (name: string): string => {
  const match = new RegExp(`--color-${name} ?: ?(#[0-9a-f]{6})`, "i").exec(css);
  if (match?.[1] === undefined) throw new Error(`Missing token ${name}`);
  return match[1];
};
const luminance = (hex: string): number => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
};
const ratio = (a: string, b: string): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
};

/** From this tone the district name is written in the light colour (DISTRICT_MAP_LIGHT_FROM). */
const LIGHT_FROM = 4;

describe("district map ramp (AGENTS.md §8)", () => {
  const tones = [0, 1, 2, 3, 4, 5, 6].map((i) => token(`ramp-${i}`));
  it("every label reaches 4.5:1 on its fill", () => {
    tones.forEach((fill, index) => {
      const text = token(index >= LIGHT_FROM ? "canvas" : "fg");
      expect(ratio(text, fill), `tone ${index}`).toBeGreaterThanOrEqual(4.5);
    });
  });
  it("gets darker with every tone", () => {
    const l = tones.map(luminance);
    l.slice(1).forEach((value, i) => expect(value).toBeLessThan(l[i] ?? 0));
  });
});
