import { describe, expect, it } from "vitest";
import { isIndexableSite, PRODUCTION_ORIGIN, robotsMetaContent } from "./indexability";

describe("isIndexableSite", () => {
  it("is true only for the production origin", () => {
    expect(isIndexableSite(new URL(PRODUCTION_ORIGIN))).toBe(true);
    expect(isIndexableSite(new URL("https://www.housyspace.com/"))).toBe(true);
  });

  it.each([
    "https://DavideSuzzarellu.github.io",
    "http://localhost:4321",
    "https://housyspace.com",
    "http://www.housyspace.com",
    "https://www.housyspace.com.evil.example",
  ])("is false for %s", (origin) => {
    expect(isIndexableSite(new URL(origin))).toBe(false);
  });

  it("is false when `site` is not configured", () => {
    expect(isIndexableSite(undefined)).toBe(false);
  });
});

describe("robotsMetaContent", () => {
  it("emits nothing for an indexable page of the production site", () => {
    expect(robotsMetaContent(true, false)).toBeUndefined();
  });

  it("keeps the per-page noindex,follow on the production site", () => {
    expect(robotsMetaContent(true, true)).toBe("noindex,follow");
  });

  it("overrides every page with noindex,nofollow on any other site", () => {
    expect(robotsMetaContent(false, false)).toBe("noindex,nofollow");
    expect(robotsMetaContent(false, true)).toBe("noindex,nofollow");
  });
});
