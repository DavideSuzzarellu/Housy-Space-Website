import { expect, test } from "@playwright/test";
import { DISTRICTS } from "../../src/features/districts/domain/districts";
import { LOCALE_META, LOCALES } from "../../src/shared/i18n/config";
import { getAlternates, getLocalizedPath } from "../../src/shared/i18n/routes";
import { blockingAxeViolations, skipIntro } from "./support";

const SITE = "https://www.housyspace.com";

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

    test("renders every section of the UI proposal in order", async ({ page }) => {
      const sections = await page
        .locator("main [data-section]")
        .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-section")));
      expect(sections).toEqual([
        "valuation",
        "featured",
        "gallery",
        "services",
        "philosophy",
        "reviews",
        "living",
        "blog",
        "contact",
      ]);
      // The hero and the presentation are not `data-section` blocks: check their headings.
      await expect(page.locator("#presentation-heading")).toBeVisible();
      await expect(page.locator('[data-section="services"] a[href*="/"] h3')).toHaveCount(8);
      await expect(page.locator('[data-section="contact"]')).toBeVisible();
      await expect(
        page.locator("[data-blog-empty], [data-section=blog] [data-post-card]").first(),
      ).toBeVisible();
    });

    test("services accordion opens a closed panel before following its link", async ({ page }) => {
      const panels = page.locator("[data-services-accordion] [data-panel]");
      await page.locator("[data-rail-wrap]").scrollIntoViewIfNeeded();
      await expect(page.locator("[data-services-accordion][data-ready]")).toHaveCount(1);
      await expect(panels.first()).toHaveAttribute("data-active", "true");
      const url = page.url();
      // A touch tap: no hover first (with a mouse, hover opens the panel and the click navigates).
      await panels.nth(2).locator("a").dispatchEvent("click");
      await expect(panels.nth(2)).toHaveAttribute("data-active", "true");
      expect(page.url()).toBe(url);
    });

    test("services carousel shows seven panels in a circle; the others are skipped by Tab", async ({
      page,
    }) => {
      const panels = page.locator("[data-services-accordion] [data-panel]");
      await expect(panels).toHaveCount(8);
      await expect(panels.locator("a:visible")).toHaveCount(7);
      await expect(panels.first()).toHaveAttribute("data-pos", "0");
      await expect(panels.nth(4)).toHaveAttribute("data-pos", "hl");
      await expect(panels.nth(4).locator("a")).toBeHidden();
    });

    test("services carousel turns round with its arrows and the keyboard", async ({ page }) => {
      const panels = page.locator("[data-services-accordion] [data-panel]");
      const rail = page.locator("[data-rail-wrap]");
      await rail.scrollIntoViewIfNeeded();
      await expect(rail.locator("[data-services-accordion][data-ready]")).toHaveCount(1);
      await rail.locator("[data-rail-next]").click();
      await expect(panels.nth(1)).toHaveAttribute("data-active", "true");
      await rail.locator("[data-rail-prev]").click();
      await rail.locator("[data-rail-prev]").click();
      // Circular: before the first comes the last.
      await expect(panels.nth(7)).toHaveAttribute("data-active", "true");
      await expect(panels.nth(7)).toHaveAttribute("data-pos", "0");

      await panels.nth(7).locator("a").focus();
      await page.keyboard.press("ArrowRight");
      await expect(panels.nth(0)).toHaveAttribute("data-active", "true");
      await expect(panels.nth(0).locator("a")).toBeFocused();
    });

    test("services carousel can be paused and resumed (WCAG 2.2.2)", async ({ page }, testInfo) => {
      test.skip(
        testInfo.project.name.includes("reduced-motion"),
        "No auto-advance, so no pause button, under reduced motion",
      );
      const rail = page.locator("[data-rail-wrap]");
      const list = rail.locator("[data-services-accordion]");
      const toggle = rail.locator("[data-rail-toggle]");
      await rail.scrollIntoViewIfNeeded();
      await expect(list).toHaveAttribute("data-ready", "true");
      await expect(toggle).toBeVisible();
      const pauseLabel = await toggle.getAttribute("aria-label");
      await toggle.click();
      await expect(list).toHaveAttribute("data-held", /.*/);
      expect(await toggle.getAttribute("aria-label")).not.toBe(pauseLabel);
      await toggle.click();
      await expect(toggle).toHaveAttribute("aria-label", pauseLabel ?? "");
    });

    test("stats count up to the figures of the content (CSS counter, no script)", async ({
      page,
    }, testInfo) => {
      // Scroll the whole row into view: the scroll-driven count ends once it has entered.
      await page.locator("#stats ul").scrollIntoViewIfNeeded();
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
      const rail = page.locator("[data-rail]");
      await rail.scrollIntoViewIfNeeded();
      await page.locator('[data-rail-step="1"]').click();
      await expect.poll(() => rail.evaluate((node) => node.scrollLeft)).toBeGreaterThan(0);
    });

    test("shows the 3 latest client reviews, newest first", async ({ page }) => {
      const section = page.locator('[data-section="reviews"]');
      await expect(section.locator("li")).toHaveCount(3);
      await expect(section.locator("li").first()).toContainText("Bruno Sorrentini");
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
          `property-${ref}-price`,
          `property-${ref}-title`,
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
