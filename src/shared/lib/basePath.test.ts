import { describe, expect, it } from "vitest";
import { withBase } from "./basePath";

describe("withBase", () => {
  it("keeps root-relative paths when the site lives at the domain root", () => {
    expect(withBase("/brand/logo.svg", "/")).toBe("/brand/logo.svg");
  });

  it("prefixes the deploy base (GitHub Pages project site), with or without trailing slash", () => {
    expect(withBase("/brand/logo.svg", "/Housy-Space-Website")).toBe(
      "/Housy-Space-Website/brand/logo.svg",
    );
    expect(withBase("/media/hero.mp4", "/Housy-Space-Website/")).toBe(
      "/Housy-Space-Website/media/hero.mp4",
    );
  });

  it("leaves absolute URLs untouched", () => {
    expect(withBase("https://media.example.com/a.jpg", "/x")).toBe(
      "https://media.example.com/a.jpg",
    );
  });
});
