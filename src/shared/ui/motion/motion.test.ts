import { describe, expect, it } from "vitest";
import { shouldPlayIntro } from "./intro";
import { scrollProgress } from "./progress";

describe("shouldPlayIntro", () => {
  const base = { seen: false, reducedMotion: false, clientNavigation: false };

  it("plays on the first hard load of the session", () => {
    expect(shouldPlayIntro(base)).toBe(true);
  });

  it("does not play once seen in this session", () => {
    expect(shouldPlayIntro({ ...base, seen: true })).toBe(false);
  });

  it("never plays under prefers-reduced-motion", () => {
    expect(shouldPlayIntro({ ...base, reducedMotion: true })).toBe(false);
  });

  it("never plays after a client-side navigation", () => {
    expect(shouldPlayIntro({ ...base, clientNavigation: true })).toBe(false);
  });
});

describe("scrollProgress", () => {
  it("returns the scrolled fraction of the scrollable height", () => {
    expect(scrollProgress({ scrollTop: 0, scrollHeight: 3000, viewportHeight: 1000 })).toBe(0);
    expect(scrollProgress({ scrollTop: 1000, scrollHeight: 3000, viewportHeight: 1000 })).toBe(0.5);
    expect(scrollProgress({ scrollTop: 2000, scrollHeight: 3000, viewportHeight: 1000 })).toBe(1);
  });

  it("clamps overscroll and handles pages that do not scroll", () => {
    expect(scrollProgress({ scrollTop: -40, scrollHeight: 3000, viewportHeight: 1000 })).toBe(0);
    expect(scrollProgress({ scrollTop: 2600, scrollHeight: 3000, viewportHeight: 1000 })).toBe(1);
    expect(scrollProgress({ scrollTop: 0, scrollHeight: 800, viewportHeight: 1000 })).toBe(0);
  });
});

describe("morph preset", () => {
  it("is calm (250–400 ms) and uses the brand easing in both directions", async () => {
    const { EASE_BRAND, MORPH_DURATION_MS, morph } = await import("./transitions");
    expect(MORPH_DURATION_MS).toBeGreaterThanOrEqual(250);
    expect(MORPH_DURATION_MS).toBeLessThanOrEqual(400);
    const { readFileSync } = await import("node:fs");
    const css = readFileSync(new URL("../../../styles/global.css", import.meta.url), "utf8");
    expect(css).toContain(`--ease-brand: ${EASE_BRAND};`);
    expect(morph.forwards).toEqual(morph.backwards);
  });
});
