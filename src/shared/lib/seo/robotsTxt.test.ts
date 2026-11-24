import { describe, expect, it } from "vitest";
import { blocksWholeSite, renderBlockedRobotsTxt, renderRobotsTxt } from "./robotsTxt";

describe("renderBlockedRobotsTxt", () => {
  const text = renderBlockedRobotsTxt();

  it("blocks everything and names no sitemap", () => {
    expect(text).toBe("User-agent: *\nDisallow: /\n");
    expect(text).not.toContain("Sitemap");
  });

  it("is told apart from the production file", () => {
    expect(blocksWholeSite(text)).toBe(true);
    expect(blocksWholeSite(renderRobotsTxt("https://www.housyspace.com"))).toBe(false);
  });
});

describe("renderRobotsTxt", () => {
  const text = renderRobotsTxt("https://www.housyspace.com");

  it("points to the sitemap index of the site", () => {
    expect(text).toContain("Sitemap: https://www.housyspace.com/sitemap-index.xml");
  });

  it("allows the site and its assets, and blocks only the internal sheet sources", () => {
    expect(text).toContain("Allow: /\n");
    expect(text.match(/^Disallow: .*$/gm)).toEqual(["Disallow: /property-sheet-source/"]);
  });
});
