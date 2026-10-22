import { describe, expect, it } from "vitest";
import { heroVideoSourceKey, shouldStreamHeroVideo } from "./heroVideo";

const allowed = { reducedMotion: false, saveData: false, effectiveType: "4g" } as const;

describe("shouldStreamHeroVideo", () => {
  it("streams the video on a regular connection with motion allowed", () => {
    expect(shouldStreamHeroVideo(allowed)).toBe(true);
  });

  it("streams when the Network Information API is unavailable", () => {
    expect(shouldStreamHeroVideo({ ...allowed, effectiveType: undefined })).toBe(true);
  });

  it("keeps the poster under prefers-reduced-motion", () => {
    expect(shouldStreamHeroVideo({ ...allowed, reducedMotion: true })).toBe(false);
  });

  it("keeps the poster when the user asked to save data", () => {
    expect(shouldStreamHeroVideo({ ...allowed, saveData: true })).toBe(false);
  });

  it.each(["slow-2g", "2g"])("keeps the poster on a %s connection", (effectiveType) => {
    expect(shouldStreamHeroVideo({ ...allowed, effectiveType })).toBe(false);
  });
});

describe("heroVideoSourceKey", () => {
  it("uses the small vertical source on portrait (mobile) viewports", () => {
    expect(heroVideoSourceKey({ portrait: true, webm: true })).toBe("portraitWebm");
    expect(heroVideoSourceKey({ portrait: true, webm: false })).toBe("portraitMp4");
  });

  it("uses the landscape source otherwise, WebM only when supported", () => {
    expect(heroVideoSourceKey({ portrait: false, webm: true })).toBe("landscapeWebm");
    expect(heroVideoSourceKey({ portrait: false, webm: false })).toBe("landscapeMp4");
  });
});
