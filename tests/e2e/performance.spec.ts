import { expect, test, type Page } from "@playwright/test";
import { getLocalizedPath } from "../../src/shared/i18n/routes";
import { skipIntro } from "./support";

/**
 * Performance budget (AGENTS.md §8: Lighthouse mobile ≥ 90, LCP < 2.5 s, no CLS) enforced on
 * the production build served by `astro preview`. No extra dependencies: the browser's own
 * Resource Timing, LCP and Layout Shift APIs. Byte budgets are encoded (compressed) sizes of
 * the initial load, with ~25 % headroom over the measured values in docs/performance.md.
 * Lighthouse remains the source of truth for scores; re-measure as described in that doc.
 */

interface PageBudget {
  /** Every same-origin resource of the initial load, hero video excluded. */
  readonly totalKB: number;
  readonly scriptKB: number;
  readonly imageKB: number;
  readonly fontFiles: number;
  readonly requests: number;
}

const BUDGETS = {
  home: { totalKB: 520, scriptKB: 12, imageKB: 380, fontFiles: 3, requests: 22 },
  // Shared by sale and rent: photo weight depends on the live Mobilia listing.
  detail: { totalKB: 220, scriptKB: 8, imageKB: 160, fontFiles: 3, requests: 16 },
  // Estimate, not yet measured: the filter island bundles full Zod (`astro/zod`, decision
  // 2026-10-22) for §8.1 URL parsing. Re-measure and tighten per docs/performance.md.
  catalog: { totalKB: 320, scriptKB: 30, imageKB: 200, fontFiles: 3, requests: 22 },
} as const satisfies Record<string, PageBudget>;

const LCP_BUDGET_MS = 2500;
const CLS_BUDGET = 0.1;
const HERO_VIDEO = "/media/hero/";

// Phone-sized viewport: the Lighthouse gate is the mobile profile.
test.use({ viewport: { width: 412, height: 823 }, deviceScaleFactor: 1.75, isMobile: true });

test.beforeEach(async ({ page }) => {
  await skipIntro(page);
  // Buffered observers: LCP candidates and layout shifts from the very first paint.
  await page.addInitScript(() => {
    const vitals = { lcp: 0, cls: 0 };
    Reflect.set(window, "__vitals", vitals);
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) vitals.lcp = entry.startTime;
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const value: unknown = Reflect.get(entry, "value");
        const hadRecentInput: unknown = Reflect.get(entry, "hadRecentInput");
        if (typeof value === "number" && hadRecentInput !== true) vitals.cls += value;
      }
    }).observe({ type: "layout-shift", buffered: true });
  });
});

interface LoadReport {
  readonly totalKB: number;
  readonly scriptKB: number;
  readonly imageKB: number;
  readonly fontFiles: number;
  readonly requests: number;
  readonly crossOrigin: readonly string[];
  readonly lcp: number;
  readonly cls: number;
}

async function measure(page: Page, path: string): Promise<LoadReport> {
  await page.goto(path, { waitUntil: "load" });
  await page.waitForLoadState("networkidle");
  return page.evaluate((heroVideo) => {
    const resources = performance
      .getEntriesByType("resource")
      .filter((entry): entry is PerformanceResourceTiming => "encodedBodySize" in entry)
      .filter((entry) => !entry.name.includes(heroVideo));
    const navigation = performance.getEntriesByType("navigation")[0];
    const documentBytes =
      navigation !== undefined && "encodedBodySize" in navigation
        ? Number(navigation.encodedBodySize)
        : 0;
    const kb = (entries: PerformanceResourceTiming[]): number =>
      entries.reduce((sum, entry) => sum + entry.encodedBodySize, 0) / 1024;
    const byPath = (pattern: RegExp) =>
      resources.filter((entry) => pattern.test(new URL(entry.name).pathname));
    const vitals: unknown = Reflect.get(window, "__vitals");
    const read = (key: "lcp" | "cls"): number => {
      const value: unknown =
        typeof vitals === "object" && vitals !== null ? Reflect.get(vitals, key) : undefined;
      return typeof value === "number" ? value : Number.NaN;
    };
    return {
      totalKB: kb(resources) + documentBytes / 1024,
      scriptKB: kb(byPath(/\.m?js$/)),
      imageKB: kb(byPath(/\.(avif|webp|jpe?g|png|svg|gif)$/)),
      fontFiles: byPath(/\.woff2?$/).length,
      requests: resources.length + 1,
      crossOrigin: resources
        .map((entry) => new URL(entry.name))
        .filter((url) => url.origin !== location.origin)
        .map((url) => url.href),
      lcp: read("lcp"),
      cls: read("cls"),
    };
  }, HERO_VIDEO);
}

/** Detail URLs (sale and rent) taken from the home featured cards: real Mobilia data. */
async function detailPaths(page: Page): Promise<{ sale?: string; rent?: string }> {
  await page.goto(getLocalizedPath("home", "es"));
  const hrefs = await page
    .locator("[data-property-card]")
    .evaluateAll((cards) => cards.map((card) => card.getAttribute("href") ?? ""));
  const under = (listing: string) => hrefs.find((href) => href.startsWith(`${listing}/`));
  const sale = under(getLocalizedPath("sale", "es"));
  const rent = under(getLocalizedPath("rent", "es"));
  return { ...(sale === undefined ? {} : { sale }), ...(rent === undefined ? {} : { rent }) };
}

function expectWithinBudget(report: LoadReport, budget: PageBudget): void {
  test.info().annotations.push({ type: "performance", description: JSON.stringify(report) });
  expect.soft(report.totalKB, "total KB (encoded)").toBeLessThanOrEqual(budget.totalKB);
  expect.soft(report.scriptKB, "JS KB (encoded)").toBeLessThanOrEqual(budget.scriptKB);
  expect.soft(report.imageKB, "image KB (encoded)").toBeLessThanOrEqual(budget.imageKB);
  expect.soft(report.fontFiles, "font files").toBeLessThanOrEqual(budget.fontFiles);
  expect.soft(report.requests, "requests").toBeLessThanOrEqual(budget.requests);
  expect.soft(report.lcp, "LCP ms").toBeLessThan(LCP_BUDGET_MS);
  expect.soft(report.cls, "CLS").toBeLessThan(CLS_BUDGET);
  // Nothing third-party loads before consent (AGENTS.md §7): the initial load is first-party.
  expect(report.crossOrigin).toEqual([]);
}

/**
 * Only the LCP image is eager; every other photo is lazy, async-decoded and sized (no CLS).
 * SVG logos (tiny, shared with the header, e.g. the intro overlay) are not photos.
 */
async function expectImageLoadingRules(page: Page): Promise<void> {
  const images = await page.locator('main img:not([src$=".svg"])').evaluateAll((nodes) =>
    nodes.map((node) => ({
      loading: node.getAttribute("loading"),
      decoding: node.getAttribute("decoding"),
      fetchpriority: node.getAttribute("fetchpriority"),
      sized: node.hasAttribute("width") && node.hasAttribute("height"),
      src: node.getAttribute("src") ?? "",
    })),
  );
  const eager = images.filter((image) => image.loading !== "lazy");
  expect(eager, "exactly one eager image (the LCP)").toHaveLength(1);
  expect(eager[0]?.fetchpriority).toBe("high");
  for (const image of images.filter((candidate) => candidate.loading === "lazy")) {
    expect(image.decoding, image.src).toBe("async");
    expect(image.fetchpriority, image.src).toBeNull();
  }
  expect(images.filter((image) => !image.sized).map((image) => image.src)).toEqual([]);
}

test.describe("performance budget (mobile, production build)", () => {
  test("home stays within budget", async ({ page }) => {
    const report = await measure(page, getLocalizedPath("home", "es"));
    expectWithinBudget(report, BUDGETS.home);
    await expectImageLoadingRules(page);
  });

  test("sale catalog stays within budget and defers Leaflet to the map views", async ({ page }) => {
    const report = await measure(page, getLocalizedPath("sale", "es"));
    expectWithinBudget(report, BUDGETS.catalog);
    await expectImageLoadingRules(page);
    const leafletRequested = await page.evaluate(() =>
      performance.getEntriesByType("resource").some((entry) => entry.name.includes("leaflet")),
    );
    expect(leafletRequested, "Leaflet in list view").toBe(false);
  });

  for (const kind of ["sale", "rent"] as const) {
    test(`${kind} detail stays within budget and defers Leaflet until the map is visible`, async ({
      page,
    }) => {
      const path = (await detailPaths(page))[kind];
      if (path === undefined) test.skip(true, `No ${kind} property among the featured cards`);
      const report = await measure(page, path ?? "");
      expectWithinBudget(report, BUDGETS.detail);
      await expectImageLoadingRules(page);

      const leafletRequested = () =>
        page.evaluate(() =>
          performance.getEntriesByType("resource").some((entry) => entry.name.includes("leaflet")),
        );
      expect(await leafletRequested(), "Leaflet before the map is visible").toBe(false);
      const map = page.locator("[data-property-map]");
      if ((await map.count()) === 0) return;
      await map.scrollIntoViewIfNeeded();
      await expect(map).toHaveAttribute("data-map-ready", "true");
      expect(await leafletRequested()).toBe(true);
    });
  }
});

test.describe("hero video is progressive enhancement", () => {
  /** Records hero video requests and whether the page `load` event had already fired. */
  async function trackVideo(page: Page): Promise<{ beforeLoad: boolean; count: number }> {
    const state = { beforeLoad: false, count: 0 };
    await page.route(`**${HERO_VIDEO}**`, async (route) => {
      state.count += 1;
      const loadEnd = await page
        .evaluate(() => {
          const navigation = performance.getEntriesByType("navigation")[0];
          return navigation !== undefined && "loadEventEnd" in navigation
            ? Number(navigation.loadEventEnd)
            : 0;
        })
        .catch(() => 0);
      if (loadEnd === 0) state.beforeLoad = true;
      await route.continue();
    });
    return state;
  }

  test("starts only after the page has loaded", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name.includes("reduced-motion"), "No video under reduced motion");
    const video = await trackVideo(page);
    await page.goto(getLocalizedPath("home", "es"), { waitUntil: "load" });
    await expect.poll(() => video.count, { timeout: 10_000 }).toBeGreaterThan(0);
    expect(video.beforeLoad).toBe(false);
  });

  test("is never downloaded under prefers-reduced-motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const video = await trackVideo(page);
    await page.goto(getLocalizedPath("home", "es"), { waitUntil: "load" });
    await page.waitForTimeout(3000);
    expect(video.count).toBe(0);
  });

  test("is never downloaded with Save-Data", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "connection", {
        configurable: true,
        get: () => ({ saveData: true, effectiveType: "4g" }),
      });
    });
    const video = await trackVideo(page);
    await page.goto(getLocalizedPath("home", "es"), { waitUntil: "load" });
    await page.waitForTimeout(3000);
    expect(video.count).toBe(0);
  });
});
