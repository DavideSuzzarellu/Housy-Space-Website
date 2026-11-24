import { describe, expect, it } from "vitest";
import { buildWebManifest, THEME_COLOR } from "./webManifest";

describe("buildWebManifest", () => {
  it("serves the site root as scope and the default locale as start URL", () => {
    const manifest = buildWebManifest("/");
    expect(manifest.scope).toBe("/");
    expect(manifest.start_url).toBe("/es");
  });

  it("keeps every URL under the deploy base (GitHub Pages staging)", () => {
    const manifest = buildWebManifest("/Housy-Space-Website/");
    expect(manifest.scope).toBe("/Housy-Space-Website/");
    expect(manifest.start_url).toBe("/Housy-Space-Website/es");
    for (const icon of manifest.icons)
      expect(icon.src).toMatch(/^\/Housy-Space-Website\/brand\/icons\//);
  });

  it("declares the three reference icons, one of them maskable", () => {
    const { icons } = buildWebManifest("/");
    expect(icons.map((icon) => icon.sizes)).toEqual(["192x192", "512x512", "512x512"]);
    expect(icons.filter((icon) => icon.purpose === "maskable")).toHaveLength(1);
  });

  it("uses the brand colour of the reference for the browser chrome", () => {
    const manifest = buildWebManifest("/");
    expect(THEME_COLOR).toBe("#102124");
    expect(manifest.theme_color).toBe(THEME_COLOR);
    expect(manifest.background_color).toBe(THEME_COLOR);
  });
});
