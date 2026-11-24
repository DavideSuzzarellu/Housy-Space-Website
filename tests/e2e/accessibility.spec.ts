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

/** Chooses an operation (the only required field) and advances the wizard to `step`. */
async function goToWizardStep(page: Page, step: number): Promise<void> {
  await page.locator('label:has(input[name="operacion"][value="venta"])').click();
  for (let current = 1; current < step; current += 1) {
    await page.locator("[data-next] button").click();
  }
  await expect(page.locator("[data-wizard-count]")).toContainText(String(step));
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
  { name: "about", path: (l) => getLocalizedPath("about", l) },
  { name: "contact", path: (l) => getLocalizedPath("contact", l) },
  { name: "my search, step 1", path: (l) => getLocalizedPath("mySearch", l) },
  {
    name: "my search, step 2",
    path: (l) => getLocalizedPath("mySearch", l),
    prepare: (page) => goToWizardStep(page, 2),
  },
  {
    name: "my search, step 5",
    path: (l) => getLocalizedPath("mySearch", l),
    prepare: (page) => goToWizardStep(page, 5),
  },
  { name: "living in Barcelona", path: (l) => getLocalizedPath("living", l) },
  { name: "district", path: (l) => getLocalizedPath("district", l, { district: "gracia" }) },
  {
    name: "barrio",
    path: (l) => getLocalizedPath("barrio", l, { barrio: "verdun" }),
  },
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
