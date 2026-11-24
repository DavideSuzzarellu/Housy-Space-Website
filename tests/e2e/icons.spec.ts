import { expect, test } from "@playwright/test";
import { skipIntro } from "./support";

/** Icons and manifest of the reference site: declared in every page head and really served. */
const BASE = (process.env["ASTRO_BASE"] ?? "/").replace(/\/$/, "");

test.describe("icons and manifest", () => {
  test("the head declares the favicons, the Apple icon, the manifest and the theme colour", async ({
    page,
    request,
  }) => {
    await skipIntro(page);
    await page.goto(`${BASE}/es`);
    const hrefs = await page
      .locator(
        "head link[rel~='icon'], head link[rel='apple-touch-icon'], head link[rel='manifest']",
      )
      .evaluateAll((links) => links.map((link) => link.getAttribute("href") ?? ""));
    expect(hrefs).toEqual([
      `${BASE}/favicon.ico`,
      `${BASE}/brand/icons/favicon.svg`,
      `${BASE}/brand/icons/apple-touch-icon.png`,
      `${BASE}/site.webmanifest`,
    ]);
    await expect(page.locator("head meta[name='theme-color']")).toHaveAttribute(
      "content",
      "#102124",
    );
    for (const href of hrefs) expect((await request.get(href)).status(), href).toBe(200);
  });

  test("the manifest lives under the deploy base and its icons are served", async ({ request }) => {
    const response = await request.get(`${BASE}/site.webmanifest`);
    expect(response.status()).toBe(200);
    const manifest = (await response.json()) as {
      start_url: string;
      scope: string;
      icons: { src: string }[];
    };
    expect(manifest.start_url).toBe(`${BASE}/es`);
    expect(manifest.scope).toBe(`${BASE}/`);
    for (const icon of manifest.icons) {
      expect((await request.get(icon.src)).status(), icon.src).toBe(200);
    }
  });
});
