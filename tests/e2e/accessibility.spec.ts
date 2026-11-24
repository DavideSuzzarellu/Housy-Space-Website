import { expect, test, type Page } from "@playwright/test";
import { LOCALES, type Locale } from "../../src/shared/i18n/config";
import { getLocalizedPath } from "../../src/shared/i18n/routes";
import { getServiceSlug } from "../../src/shared/i18n/services";
import { skipIntro, wcagViolations } from "./support";

/**
 * WCAG 2.2 AA (axe) on every page type in every locale (AGENTS.md §8). All impacts count and
 * there are no colour exceptions: a violation is fixed with the AA token, never ignored here.
 */

interface PageCase {
  readonly name: string;
  readonly path: (locale: Locale) => string;
  /** Puts the page in a second visual state before scanning (revealed fields, open widgets). */
  readonly prepare?: (page: Page) => Promise<void>;
}

const PAGE_CASES: readonly PageCase[] = [
  { name: "home", path: (l) => getLocalizedPath("home", l) },
  { name: "sale catalog", path: (l) => getLocalizedPath("sale", l) },
  { name: "rent catalog", path: (l) => getLocalizedPath("rent", l) },
  { name: "services index", path: (l) => getLocalizedPath("services", l) },
  {
    name: "service: sale brokerage",
    path: (l) =>
      getLocalizedPath("serviceDetail", l, { service: getServiceSlug("saleBrokerage", l) }),
  },
  {
    name: "service: legal and tax",
    path: (l) => getLocalizedPath("serviceDetail", l, { service: getServiceSlug("legalTax", l) }),
  },
  { name: "valuation", path: (l) => getLocalizedPath("valuation", l) },
  { name: "sell", path: (l) => getLocalizedPath("sell", l) },
  { name: "about", path: (l) => getLocalizedPath("about", l) },
  { name: "contact", path: (l) => getLocalizedPath("contact", l) },
  { name: "custom search", path: (l) => getLocalizedPath("customSearch", l) },
  {
    name: "home search with a district chosen",
    path: (l) => getLocalizedPath("homeSearch", l),
    prepare: async (page) => {
      await page.locator('input[name="distrito"][value="ciutat-vella"]').check({ force: true });
      await expect(page.locator('input[name="barrio"][value="el-raval"]')).toBeVisible();
    },
  },
  { name: "living in Barcelona", path: (l) => getLocalizedPath("living", l) },
  { name: "district", path: (l) => getLocalizedPath("district", l, { district: "gracia" }) },
  {
    name: "barrio",
    path: (l) => getLocalizedPath("barrio", l, { district: "nou-barris", barrio: "verdun" }),
  },
  { name: "Barcelona province", path: (l) => getLocalizedPath("municipalities", l) },
  { name: "blog", path: (l) => getLocalizedPath("blog", l) },
  { name: "legal notice", path: (l) => getLocalizedPath("legalNotice", l) },
  { name: "privacy policy", path: (l) => getLocalizedPath("privacy", l) },
  { name: "cookie policy", path: (l) => getLocalizedPath("cookies", l) },
  { name: "international guide", path: (l) => getLocalizedPath("internationalGuide", l) },
  { name: "data sources", path: (l) => getLocalizedPath("dataSources", l) },
  { name: "404", path: (l) => `${getLocalizedPath("home", l)}/no-existe` },
];

test.beforeEach(async ({ page }) => {
  await skipIntro(page);
});

for (const locale of LOCALES) {
  test.describe(`accessibility (${locale})`, () => {
    for (const pageCase of PAGE_CASES) {
      test(`${pageCase.name} has no WCAG 2.2 AA violations`, async ({ page }) => {
        await page.goto(pageCase.path(locale));
        await pageCase.prepare?.(page);
        expect(await wcagViolations(page)).toEqual([]);
      });
    }

    test("a property detail has no WCAG 2.2 AA violations", async ({ page }) => {
      await page.goto(getLocalizedPath("home", locale));
      const href = await page.locator("[data-property-card]").first().getAttribute("href");
      expect(href, "the home features at least one property").not.toBeNull();
      await page.goto(href ?? "");
      expect(await wcagViolations(page)).toEqual([]);
    });
  });
}
