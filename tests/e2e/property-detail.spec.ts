import { expect, test, type Page } from "@playwright/test";
import { LOCALE_META, LOCALES, type Locale } from "../../src/shared/i18n/config";
import { getLocalizedPath } from "../../src/shared/i18n/routes";
import { SITE_HEADER_TRANSITION_NAME } from "../../src/shared/lib/transitionNames";
import { blockingAxeViolations, skipIntro } from "./support";

const SITE = "https://www.housyspace.com";
const PARTS = ["image", "title", "price"] as const;

test.beforeEach(async ({ page }) => {
  await skipIntro(page);
});

/** Detail URL of the first featured card on the home page of a locale (real Mobilia data). */
async function firstDetailPath(page: Page, locale: Locale): Promise<{ path: string; ref: string }> {
  await page.goto(getLocalizedPath("home", locale));
  const card = page.locator("[data-property-card]").first();
  const path = await card.getAttribute("href");
  const ref = await card.getAttribute("data-ref");
  if (path === null || ref === null) throw new Error("No featured property card on the home");
  return { path, ref };
}

/** Every computed `view-transition-name` on the page (excluding `none`). */
async function transitionNames(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll("body *")]
      .map((element) => getComputedStyle(element).viewTransitionName)
      .filter((name) => name !== "none" && name !== ""),
  );
}

const morphNames = (ref: string) => PARTS.map((part) => `property-${ref}-${part}`);

test.describe("card → detail shared-element morph", () => {
  test("clicking a featured card opens its detail with matching transition names; back returns", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));

    const home = getLocalizedPath("home", "es");
    const { path, ref } = await firstDetailPath(page, "es");
    const card = page.locator(`[data-property-card][data-ref="${ref}"]`);
    const cardNames = await card
      .locator("[data-astro-transition-scope]")
      .evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).viewTransitionName));
    const expected = morphNames(ref).filter((name) => cardNames.includes(name));
    expect(expected.length).toBeGreaterThanOrEqual(2); // image + title (price may be absent)

    await card.click();
    await expect(page).toHaveURL(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const detailNames = await transitionNames(page);
    for (const name of expected) {
      expect(detailNames.filter((candidate) => candidate === name)).toHaveLength(1);
    }
    await expect(page.locator("header[data-header]")).toHaveCSS(
      "view-transition-name",
      SITE_HEADER_TRANSITION_NAME,
    );

    await page.goBack();
    await expect(page).toHaveURL(home);
    await expect(card).toBeVisible();
    const backNames = await transitionNames(page);
    for (const name of expected) expect(backNames).toContain(name);
    expect(errors).toEqual([]);
  });

  test("no transition name is used twice on a detail page (similar properties included)", async ({
    page,
  }) => {
    const { path } = await firstDetailPath(page, "es");
    await page.goto(path);
    const names = await transitionNames(page);
    expect(names.length).toBeGreaterThan(0);
    expect(new Set(names).size).toBe(names.length);
  });
});

for (const locale of LOCALES) {
  test.describe(`property detail (${locale})`, () => {
    let path = "";
    let ref = "";

    test.beforeEach(async ({ page }) => {
      ({ path, ref } = await firstDetailPath(page, locale));
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
    });

    test("renders the localized detail with one h1, facts, contact and energy rating", async ({
      page,
    }) => {
      await expect(page.locator("html")).toHaveAttribute("lang", LOCALE_META[locale].langTag);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      await expect(page.locator("[data-property-detail]")).toHaveAttribute("data-ref", ref);
      await expect(page.locator("#detail-energy")).toBeVisible();
      await expect(page.locator("[data-property-contact] a[href^='tel:']")).toHaveCount(1);
      await expect(page.locator("[data-property-contact] a[href*='wa.me']")).toHaveAttribute(
        "href",
        new RegExp(`text=.*${ref}`),
      );
    });

    test("emits a self canonical and hreflang alternates that all resolve", async ({
      page,
      request,
    }) => {
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `${SITE}${path}`);
      const alternates = await page
        .locator('link[rel="alternate"][hreflang]')
        .evaluateAll((links) =>
          links.map((link) => [link.getAttribute("hreflang"), link.getAttribute("href")] as const),
        );
      expect(alternates.map(([hreflang]) => hreflang)).toEqual([
        ...LOCALES.map((candidate) => LOCALE_META[candidate].langTag),
        "x-default",
      ]);
      expect(alternates).toContainEqual([LOCALE_META[locale].langTag, `${SITE}${path}`]);
      for (const [, href] of alternates) {
        if (href === null) throw new Error("hreflang without href");
        const target = new URL(href);
        expect(target.pathname).toMatch(new RegExp(`-${ref}$`));
        expect((await request.get(target.pathname)).status()).toBe(200);
      }
    });

    test("ships valid JSON-LD with the dwelling, an EUR offer and the agency as seller", async ({
      page,
    }) => {
      const raw = await page.locator('script[type="application/ld+json"]').textContent();
      const data: unknown = JSON.parse(raw ?? "");
      const json = JSON.stringify(data);
      expect(json).toContain('"@type":"Offer"');
      expect(json).toContain('"@type":"RealEstateAgent"');
      expect(json).toMatch(/"@type":"(Apartment|Residence)"/);
      if (json.includes('"price"')) expect(json).toContain('"priceCurrency":"EUR"');
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
        "content",
        /^https:\/\/media\.mobiliagestion\.es\//,
      );
    });

    test("loads the map with the ICGC attribution when scrolled into view", async ({ page }) => {
      const map = page.locator("[data-property-map]");
      if ((await map.count()) === 0) test.skip(true, "Property without location");
      await map.scrollIntoViewIfNeeded();
      await expect(map).toHaveAttribute("data-map-ready", "true");
      await expect(map.locator(".leaflet-control-attribution")).toContainText("ICGC (CC BY 4.0)");
      // Always an approximate area, never a pin (AGENTS.md §5).
      await expect(map.locator("path.property-map-area")).toHaveCount(1);
      await expect(map.locator(".leaflet-marker-icon")).toHaveCount(0);
    });

    test("downloads the property sheet as a PDF without leaving the page", async ({
      page,
      request,
    }) => {
      const link = page.locator("[data-property-contact] a[download]");
      await expect(link).toHaveAttribute("download", /^HousySpace-[A-Z0-9-]+\.pdf$/);
      const href = await link.getAttribute("href");
      expect(href).toMatch(new RegExp(`^/pdf/housyspace-${ref}-(sale|rent)-${locale}\\.pdf$`));
      if (href === null) throw new Error("Sheet link without href");

      const response = await request.get(href);
      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"]).toContain("application/pdf");
      expect((await response.body()).subarray(0, 5).toString()).toBe("%PDF-");

      const [download] = await Promise.all([page.waitForEvent("download"), link.click()]);
      expect(download.suggestedFilename()).toBe(await link.getAttribute("download"));
      await expect(page).toHaveURL(path);
    });

    test("does not publish the internal HTML source of the sheet", async ({ request }) => {
      const sheet = `${ref}-sale`;
      expect((await request.get(`/property-sheet-source/${locale}/${sheet}`)).status()).toBe(404);
    });

    test("has no serious or critical axe violations", async ({ page }) => {
      expect(await blockingAxeViolations(page)).toEqual([]);
    });
  });
}

test("gallery lightbox works with the keyboard (open, arrows, Escape)", async ({ page }) => {
  const { path } = await firstDetailPath(page, "en");
  await page.goto(path);
  const opener = page.locator("[data-gallery-open='0']").first();
  const dialog = page.locator("[data-gallery-dialog]");
  const slides = dialog.locator("[data-slide]");
  const count = await slides.count();
  expect(count).toBeGreaterThan(0);

  const decoded = (index: number) =>
    slides
      .nth(index)
      .locator("img")
      .evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0);
  // Lightbox photos cost nothing until the visitor shows intent.
  expect(await decoded(count - 1)).toBe(false);

  await opener.focus();
  await page.keyboard.press("Enter");
  await expect(dialog).toBeVisible();
  await expect(slides.nth(0)).toBeVisible();
  await expect(dialog.locator("[data-gallery-close]")).toBeFocused();
  // Next and previous photos are preloaded on open: stepping never waits on the network.
  await expect.poll(() => decoded(1 % count)).toBe(true);
  await expect.poll(() => decoded(count - 1)).toBe(true);

  if (count > 1) {
    await page.keyboard.press("ArrowRight");
    await expect(slides.nth(1)).toBeVisible();
    await expect(slides.nth(0)).toBeHidden();
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    await expect(slides.nth(count - 1)).toBeVisible();
  }

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
  expect(await blockingAxeViolations(page)).toEqual([]);
});

test.describe("reduced motion", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  test("card → detail navigation swaps content without errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const { path, ref } = await firstDetailPath(page, "ca");
    await page.locator(`[data-property-card][data-ref="${ref}"]`).click();
    await expect(page).toHaveURL(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "ca-ES");
    expect(errors).toEqual([]);
  });
});
