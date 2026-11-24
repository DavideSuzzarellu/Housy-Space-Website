import { expect, test, type Page } from "@playwright/test";
import { skipIntro } from "./support";

/**
 * Client-side navigation regressions (AGENTS.md §3.3). Self-contained on purpose: it does not
 * import the route map, so it keeps working in Node where `import.meta.env` does not exist.
 * Keep `BASE` equal to `base` in astro.config.ts.
 */
const BASE = "/Housy-Space-Website";
const LANG_TAG = { es: "es-ES", en: "en", it: "it-IT", ca: "ca-ES" } as const;
const LOCALES = ["es", "en", "it", "ca"] as const;

test.beforeEach(async ({ page }) => {
  await skipIntro(page);
});

/** Marks the document so a full reload (which would drop the marker) is detectable. */
async function markDocument(page: Page): Promise<void> {
  await page.evaluate(() => {
    (window as unknown as { __marker: string }).__marker = "alive";
  });
}

const stillSameDocument = (page: Page): Promise<boolean> =>
  page.evaluate(() => (window as unknown as { __marker?: string }).__marker === "alive");

/** Clicks a link the way a visitor does (real click: the router must intercept it). */
async function clickLink(page: Page, href: string): Promise<void> {
  await page.locator(`a[href="${href}"]:visible`).first().click();
}

test.describe("language switcher", () => {
  for (const from of LOCALES) {
    const to = from === "es" ? "en" : "es";
    test(`${from} → ${to} stays in the app, keeps the base and updates <html lang>`, async ({
      page,
    }) => {
      await page.goto(`${BASE}/${from}`);
      await markDocument(page);
      await clickLink(page, `${BASE}/${to}`);
      await expect(page).toHaveURL(new RegExp(`${BASE}/${to}$`));
      await expect(page.locator("html")).toHaveAttribute("lang", LANG_TAG[to]);
      expect(await stillSameDocument(page)).toBe(true);
    });
  }

  test("translates the path of an inner page (listing)", async ({ page }) => {
    await page.goto(`${BASE}/es/venta`);
    await markDocument(page);
    await clickLink(page, `${BASE}/en/sale`);
    await expect(page).toHaveURL(new RegExp(`${BASE}/en/sale$`));
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    expect(await stillSameDocument(page)).toBe(true);
  });
});

test.describe("scripts bound on astro:page-load", () => {
  test("the wizard advances one step per click after leaving the page and coming back", async ({
    page,
  }) => {
    await page.goto(`${BASE}/es/mi-busqueda`);
    await markDocument(page);
    const count = page.locator("[data-wizard-count]");
    const next = page.locator("[data-next] button");
    await expect(count).toContainText("1");

    await page.locator('[name="operacion"]').first().check({ force: true });
    await next.click();
    await expect(count).toContainText("2");

    await clickLink(page, `${BASE}/es/contacto`);
    await expect(page).toHaveURL(/\/es\/contacto$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/es\/mi-busqueda$/);

    // Fresh page: step 1 again, exactly one visible step, one step per click.
    await expect(count).toContainText("1");
    await expect(
      page.locator("[data-wizard] fieldset[data-step]:not([data-step-off])"),
    ).toHaveCount(1);
    await page.locator('[name="operacion"]').first().check({ force: true });
    await next.click();
    await expect(count).toContainText("2");
    await expect(
      page.locator("[data-wizard] fieldset[data-step]:not([data-step-off])"),
    ).toHaveCount(1);
    expect(await stillSameDocument(page)).toBe(true);
  });

  test("document-level listeners do not pile up across visits (barrio search)", async ({
    page,
  }) => {
    // Counts live `pointerdown` listeners on document; one bound with an aborted signal is gone.
    await page.addInitScript(() => {
      const live: { fn: unknown; signal: AbortSignal | undefined }[] = [];
      const add = document.addEventListener.bind(document);
      document.addEventListener = ((type: string, fn: never, options?: unknown) => {
        if (type === "pointerdown") {
          const signal =
            typeof options === "object" && options !== null
              ? (options as { signal?: AbortSignal }).signal
              : undefined;
          live.push({ fn, signal });
        }
        add(type, fn, options as AddEventListenerOptions);
      }) as typeof document.addEventListener;
      (window as unknown as { __pointerdown: () => number }).__pointerdown = () =>
        live.filter((entry) => entry.signal === undefined || !entry.signal.aborted).length;
    });
    await page.goto(`${BASE}/es/zonas/barcelona`);
    const baseline = await page.evaluate(() =>
      (window as unknown as { __pointerdown: () => number }).__pointerdown(),
    );
    for (let visit = 0; visit < 3; visit += 1) {
      await clickLink(page, `${BASE}/es/servicios`);
      await expect(page).toHaveURL(/\/es\/servicios$/);
      await clickLink(page, `${BASE}/es/zonas/barcelona`);
      await expect(page).toHaveURL(/\/es\/zonas\/barcelona$/);
    }
    const after = await page.evaluate(() =>
      (window as unknown as { __pointerdown: () => number }).__pointerdown(),
    );
    expect(after).toBe(baseline);
  });
});
