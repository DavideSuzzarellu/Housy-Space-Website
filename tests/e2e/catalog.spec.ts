import { expect, test, type Page } from "@playwright/test";
import { LOCALE_META, LOCALES } from "../../src/shared/i18n/config";
import { getLocalizedPath } from "../../src/shared/i18n/routes";
import { blockingAxeViolations, skipIntro } from "./support";

/**
 * Catalog (AGENTS.md §6 item 18) against the production build with real Mobilia data: the
 * assertions only rely on what the page itself lists, never on specific listings.
 */

test.beforeEach(async ({ page }) => {
  await skipIntro(page);
});

const cards = (page: Page) => page.locator("[data-catalog-ref]");
const visibleCards = (page: Page) => page.locator("[data-catalog-ref]:not([hidden])");

for (const locale of LOCALES) {
  for (const listing of ["sale", "rent"] as const) {
    test(`${locale} ${listing} catalog renders, is accessible and canonical`, async ({ page }) => {
      const path = getLocalizedPath(listing, locale);
      await page.goto(path);
      await expect(page.locator("html")).toHaveAttribute("lang", LOCALE_META[locale].langTag);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      await expect(page.getByRole("search")).toBeVisible();
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        new RegExp(`${path}$`),
      );
      expect(await blockingAxeViolations(page)).toEqual([]);
    });
  }
}

test("filters sync with the URL, survive a reload and can be cleared", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const path = getLocalizedPath("sale", "es");
  await page.goto(path);
  const total = await cards(page).count();
  test.skip(total === 0, "No sale listings published");

  // An impossible minimum: every card is hidden and the empty state shows.
  await page.locator("details summary").click();
  await page.locator('input[name="smin"]').fill("999999");
  await expect(page).toHaveURL(/[?&]smin=999999/);
  await expect(visibleCards(page)).toHaveCount(0);
  await expect(page.locator("[data-catalog-empty]")).toBeVisible();

  await page.reload();
  await expect(page.locator('input[name="smin"]')).toHaveValue("999999");
  await expect(visibleCards(page)).toHaveCount(0);

  await page.locator("[data-catalog-empty] [data-catalog-clear]").click();
  await expect(visibleCards(page)).toHaveCount(total);
  await expect(page).toHaveURL(new RegExp(`${path}$`));
  expect(errors).toEqual([]);
});

test("ignores invalid params from a shared link instead of breaking", async ({ page }) => {
  await page.goto(`${getLocalizedPath("sale", "es")}?hab=abc&orden=nope&vista=grid`);
  const total = await cards(page).count();
  await expect(visibleCards(page)).toHaveCount(total);
  await expect(page.locator("[data-catalog]")).toHaveAttribute("data-view", "list");
});

test("sorting by price reorders the cards", async ({ page }) => {
  await page.goto(getLocalizedPath("sale", "es"));
  test.skip((await cards(page).count()) < 2, "Needs at least two sale listings");
  await page.locator('select[name="orden"]').selectOption("precio-asc");
  await expect(page).toHaveURL(/orden=precio-asc/);
  const asc = await cards(page).evaluateAll((items) =>
    items.map((item) => item.dataset["catalogRef"]),
  );
  await page.locator('select[name="orden"]').selectOption("precio-desc");
  await expect(page).toHaveURL(/orden=precio-desc/);
  const desc = await cards(page).evaluateAll((items) =>
    items.map((item) => item.dataset["catalogRef"]),
  );
  expect(desc).not.toEqual(asc);
});

test("map view loads Leaflet only on demand and draws the listings", async ({ page }) => {
  await page.goto(getLocalizedPath("sale", "es"));
  const leafletRequested = () =>
    page.evaluate(() =>
      performance.getEntriesByType("resource").some((entry) => entry.name.includes("leaflet")),
    );
  expect(await leafletRequested()).toBe(false);

  await page.locator('[data-catalog-view="map"]').click();
  await expect(page).toHaveURL(/vista=mapa/);
  await expect(page.locator('[data-catalog-view="map"]')).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("[data-catalog-map].leaflet-container")).toBeVisible();
  expect(await leafletRequested()).toBe(true);
  if ((await cards(page).count()) > 0) {
    await expect(page.locator(".catalog-pin, .catalog-cluster").first()).toBeVisible();
  }
  // Colour ICGC base map (AGENTS.md §2).
  await expect(page.locator('img.leaflet-tile[src*="/estandard/"]').first()).toBeAttached();
});

test("the map never reveals an exact location: only wide zones", async ({ page }) => {
  await page.goto(`${getLocalizedPath("sale", "es")}?vista=mapa`);
  test.skip((await cards(page).count()) === 0, "No sale listings published");
  const map = page.locator("[data-catalog-map].leaflet-container");
  await expect(map).toBeVisible();
  await map.scrollIntoViewIfNeeded();
  // Zoom in as far as allowed: listings show as zone circles, never as a precise pin.
  // Leaflet drops clicks during a zoom animation, so wait for each one to end. `force`: the
  // control disables itself exactly when the last zoom ends, racing the enabled check.
  const zoomIn = page.locator(".leaflet-control-zoom-in");
  for (let step = 0; step < 10; step += 1) {
    if ((await zoomIn.getAttribute("aria-disabled")) === "true") break;
    await zoomIn.click({ force: true });
    await expect(map.locator(".leaflet-zoom-anim")).toHaveCount(0);
  }
  await expect(zoomIn).toHaveAttribute("aria-disabled", "true");
  await expect(page.locator("path.property-map-area").first()).toBeAttached();
  const payload = await page.locator("script[data-catalog-entries]").textContent();
  expect(payload ?? "").not.toMatch(/"(address|precision|latitud|longitud)"/);
});

test("search in this map area filters by the visible zone and can be removed", async ({ page }) => {
  await page.goto(`${getLocalizedPath("sale", "es")}?vista=mapa`);
  const map = page.locator("[data-catalog-map].leaflet-container");
  await expect(map).toBeVisible();
  const searchArea = page.locator("[data-catalog-search-area]");
  await expect(searchArea).toBeHidden();

  // The map starts below the fold: drag inside the viewport, not at off-screen coordinates.
  await map.scrollIntoViewIfNeeded();
  const box = await map.boundingBox();
  if (box === null) throw new Error("map has no box");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 120, box.y + box.height / 2 + 60, { steps: 8 });
  await page.mouse.up();
  await expect(searchArea).toBeVisible();

  await searchArea.click();
  await expect(page).toHaveURL(/[?&]mapa=-?\d+\.\d{5}(%2C|,)/);
  await expect(page.locator("[data-catalog-clear-area]")).toBeVisible();
  await page.locator("[data-catalog-clear-area]").click();
  await expect(page).not.toHaveURL(/mapa=/);
  await expect(page.locator("[data-catalog-clear-area]")).toBeHidden();
});

test("works without JavaScript: every listing is visible", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(getLocalizedPath("rent", "en"));
  const total = await cards(page).count();
  await expect(visibleCards(page)).toHaveCount(total);
  await context.close();
});
