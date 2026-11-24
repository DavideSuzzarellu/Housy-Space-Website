import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { DISTRICTS } from "../../src/features/districts/domain/districts";
import { LOCALE_META, LOCALES } from "../../src/shared/i18n/config";
import { getAlternates, getLocalizedPath } from "../../src/shared/i18n/routes";
import { blockingAxeViolations, skipIntro } from "./support";

// Production origin: the same file the site and the Cloudflare worker read (deploy.config.json).
const { productionOrigin: SITE } = JSON.parse(readFileSync("deploy.config.json", "utf8")) as {
  productionOrigin: string;
};

for (const locale of LOCALES) {
  test.describe(`home (${locale})`, () => {
    test.beforeEach(async ({ page }) => {
      await skipIntro(page);
      const response = await page.goto(getLocalizedPath("home", locale));
      expect(response?.status()).toBe(200);
    });

    test("sets the html lang for the locale", async ({ page }) => {
      await expect(page.locator("html")).toHaveAttribute("lang", LOCALE_META[locale].langTag);
    });

    test("has exactly one h1", async ({ page }) => {
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    });

    test("emits a self canonical and hreflang alternates with x-default", async ({ page }) => {
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        `${SITE}${getLocalizedPath("home", locale)}`,
      );
      for (const alternate of getAlternates("home")) {
        await expect(
          page.locator(`link[rel="alternate"][hreflang="${alternate.hreflang}"]`),
        ).toHaveAttribute("href", `${SITE}${alternate.path}`);
      }
    });

    test("has a working skip-to-content link", async ({ page }) => {
      await page.keyboard.press("Tab");
      const skipLink = page.locator('a[href="#main-content"]');
      await expect(skipLink).toBeFocused();
      await skipLink.press("Enter");
      await expect(page.locator("#main-content")).toBeFocused();
    });

    test("renders every section of the reference home in order", async ({ page }) => {
      const sections = await page
        .locator("main [data-section]")
        .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-section")));
      // The blog block renders only once an article is published (the reference always has one).
      expect(sections.filter((section) => section !== "blog")).toEqual([
        "services",
        "valuation",
        "philosophy",
        "featured",
        "reviews",
        "living",
      ]);
      // The hero and the figures are not `data-section` blocks: check their headings.
      await expect(page.locator("#home-hero-heading")).toBeVisible();
      await expect(page.locator("#cifras")).toBeVisible();
      await expect(page.locator("[data-services-triple] [data-card]")).toHaveCount(8);
      await expect(page.locator("[data-blog-empty]")).toHaveCount(0);
    });

    test("the hero offers the valuation and the about page", async ({ page }) => {
      const hero = page.locator("[data-hero]");
      await expect(
        hero.locator(`a[href="${getLocalizedPath("valuation", locale)}"]`),
      ).toBeVisible();
      await expect(hero.locator(`a[href="${getLocalizedPath("about", locale)}"]`)).toBeVisible();
    });

    test("services accordion: three cards open, a closed tab opens its three", async ({ page }) => {
      const root = page.locator("[data-services-triple]");
      await root.scrollIntoViewIfNeeded();
      await expect(page.locator("[data-services-triple][data-ready]")).toHaveCount(1);
      const panels = root.locator("[data-panel]");
      await expect(panels).toHaveCount(8);
      await expect(root.locator("[data-panel][data-on]")).toHaveCount(3);
      await expect(panels.first()).toHaveAttribute("data-on", "");
      await panels.nth(5).locator("[data-tab]").click();
      // A tab after the window opens as the last of the three.
      await expect(panels.nth(3)).toHaveAttribute("data-on", "");
      await expect(panels.nth(5)).toHaveAttribute("data-on", "");
      await expect(panels.first()).not.toHaveAttribute("data-on", "");
      await expect(panels.nth(5).locator("[data-tab]")).toHaveAttribute("aria-expanded", "true");
    });

    test("services accordion pages by three with its arrows and wraps", async ({ page }) => {
      const root = page.locator("[data-services-triple]");
      await root.scrollIntoViewIfNeeded();
      await expect(page.locator("[data-services-triple][data-ready]")).toHaveCount(1);
      const panels = root.locator("[data-panel]");
      await root.locator('[data-arrow="next"]').click();
      await expect(panels.nth(3)).toHaveAttribute("data-on", "");
      await root.locator('[data-arrow="next"]').click();
      await expect(panels.nth(7)).toHaveAttribute("data-on", "");
      // Past the end it goes back to the first three; before the first, to the last three.
      await root.locator('[data-arrow="next"]').click();
      await expect(panels.first()).toHaveAttribute("data-on", "");
      await root.locator('[data-arrow="prev"]').click();
      await expect(panels.nth(7)).toHaveAttribute("data-on", "");
    });

    test("stats count up to the figures of the content (CSS counter, no script)", async ({
      page,
    }, testInfo) => {
      // Scroll the whole row into view: the scroll-driven count ends once it has entered.
      await page.locator("#cifras ul").scrollIntoViewIfNeeded();
      await page.evaluate(() => window.scrollBy(0, 300));
      // The figures are in the markup either way (screen readers, no scroll timeline support).
      await expect(page.locator(".stat-final")).toHaveText(["35", "100", "60", "9"]);
      // Under reduced motion the counter is not animated: the final figures are shown as is.
      if (testInfo.project.name.includes("reduced-motion")) return;
      await expect
        .poll(() =>
          page
            .locator(".stat-count")
            .evaluateAll((nodes) =>
              nodes.map((node) => getComputedStyle(node).getPropertyValue("--count").trim()),
            ),
        )
        .toEqual(["35", "100", "60", "9"]);
    });

    test("districts carousel moves with its buttons", async ({ page }) => {
      const rail = page.locator("#districts-rail");
      await rail.scrollIntoViewIfNeeded();
      await page.locator('[data-rail-for="districts-rail"][data-rail-step="1"]').click();
      await expect.poll(() => rail.evaluate((node) => node.scrollLeft)).toBeGreaterThan(0);
    });

    test("shows the 3 latest client reviews, newest first", async ({ page }) => {
      const section = page.locator('[data-section="reviews"]');
      await expect(section.locator("article")).toHaveCount(3);
      await expect(section.locator("article").first()).toContainText("Bruno Sorrentini");
    });

    test("reviews rail has previous and next buttons, the first one disabled at the start", async ({
      page,
    }) => {
      const section = page.locator('[data-section="reviews"]');
      await section.scrollIntoViewIfNeeded();
      await expect(section.locator('[data-rail-step="-1"]')).toBeDisabled();
      await expect(section.locator("#reviews-rail")).toHaveAttribute("role", "region");
    });

    test("links to the 10 district pages", async ({ page }) => {
      for (const district of DISTRICTS) {
        await expect(
          page.locator(
            `[data-section="living"] a[href="${getLocalizedPath("district", locale, { district: district.slug })}"]`,
          ),
        ).not.toHaveCount(0);
      }
    });

    test("shows featured properties from Mobilia with detail links and morph names", async ({
      page,
    }) => {
      const cards = page.locator("[data-property-card]");
      const count = await cards.count();
      expect(count).toBeGreaterThan(0);
      expect(count).toBeLessThanOrEqual(3);
      const detailPattern = new RegExp(
        `^/${locale}/(${["venta", "sale", "vendita", "venda", "alquiler", "rent", "affitto", "lloguer"].join("|")})/[a-z0-9-]+$`,
      );
      for (let index = 0; index < count; index += 1) {
        const card = cards.nth(index);
        expect(await card.getAttribute("href")).toMatch(detailPattern);
        const ref = await card.getAttribute("data-ref");
        const names = await card
          .locator("[data-astro-transition-scope]")
          .evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).viewTransitionName));
        expect(names).toEqual([
          `property-${ref}-image`,
          `property-${ref}-title`,
          `property-${ref}-price`,
        ]);
      }
    });

    test("shows the company data and AICAT number in the footer", async ({ page }) => {
      const footer = page.getByRole("contentinfo");
      await expect(footer).toContainText("B26903419");
      // The AICAT number is the alt text of its seal (logo only, AGENTS.md section 11.6).
      await expect(footer.locator('img[alt*="14032"]')).toHaveCount(1);
    });

    test("has no serious or critical axe violations", async ({ page }) => {
      expect(await blockingAxeViolations(page)).toEqual([]);
    });
  });
}

test("language switcher navigates to the counterpart page and updates lang", async ({ page }) => {
  await skipIntro(page);
  await page.goto(getLocalizedPath("home", "es"));
  await page.locator('header a[hreflang="it-IT"]').click();
  await expect(page).toHaveURL(getLocalizedPath("home", "it"));
  await expect(page.locator("html")).toHaveAttribute("lang", "it-IT");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    `${SITE}${getLocalizedPath("home", "it")}`,
  );
});

test("unknown paths render the 404 page", async ({ page }) => {
  const response = await page.goto("/es/this-page-does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex,follow");
});
