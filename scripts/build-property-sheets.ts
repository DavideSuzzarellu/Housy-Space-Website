/**
 * Prints every property sheet source page in `dist` to its PDF (AGENTS.md §6 item 24), then
 * removes the HTML sources: only the PDFs are published. Runs after `astro build`.
 *
 * Chromium (Playwright) loads each page from `dist` through request interception on a fake
 * origin, so no server is needed; only remote resources (ICGC tiles) hit the network.
 * Requires the Chromium build: `bunx playwright install chromium`.
 */
import { existsSync, statSync } from "node:fs";
import { mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, type BrowserContext } from "@playwright/test";
import {
  PROPERTY_SHEET_PDF_META,
  PROPERTY_SHEET_PDF_PATH,
  PROPERTY_SHEET_SOURCE_DIR,
} from "../src/features/properties/application/propertySheetBuild.ts";

const DIST = fileURLToPath(new URL("../dist/", import.meta.url));
const SOURCE_ROOT = path.join(DIST, PROPERTY_SHEET_SOURCE_DIR);
/** Never resolved by DNS: every request to it is answered from `dist`. */
const ORIGIN = "http://property-sheets.localhost";
const CONCURRENCY = 4;
const NAVIGATION_TIMEOUT_MS = 60_000;

/** `dist` file for a URL path (`/a/b` → `a/b/index.html` or `a/b.html`), never outside `dist`. */
function distFile(urlPath: string): string | undefined {
  const relative = decodeURIComponent(urlPath).replace(/^\/+/, "");
  const candidates = [relative, `${relative}/index.html`, `${relative}.html`];
  for (const candidate of candidates) {
    const file = path.resolve(DIST, candidate);
    if (!file.startsWith(DIST)) return undefined;
    if (statSync(file, { throwIfNoEntry: false })?.isFile() === true) return file;
  }
  return undefined;
}

/** URL paths of the source pages: `/property-sheet-source/{locale}/{sheet}`. */
async function sourcePages(): Promise<string[]> {
  if (!existsSync(SOURCE_ROOT)) return [];
  const entries = await readdir(SOURCE_ROOT, { recursive: true, withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".html"))
    .map((entry) => {
      const file = path.relative(DIST, path.join(entry.parentPath, entry.name));
      const urlPath = `/${file.split(path.sep).join("/")}`;
      return urlPath.replace(/\/index\.html$/, "").replace(/\.html$/, "");
    })
    .sort();
}

async function serveDist(context: BrowserContext): Promise<void> {
  await context.route(`${ORIGIN}/**`, async (route) => {
    const file = distFile(new URL(route.request().url()).pathname);
    await (file === undefined
      ? route.fulfill({ status: 404, body: "Not found" })
      : route.fulfill({ path: file }));
  });
}

/** Prints one source page; returns the written PDF path and how many images failed to load. */
async function printSheet(
  context: BrowserContext,
  urlPath: string,
): Promise<{ pdf: string; brokenImages: number }> {
  const page = await context.newPage();
  try {
    await page.goto(`${ORIGIN}${urlPath}`, {
      waitUntil: "networkidle",
      timeout: NAVIGATION_TIMEOUT_MS,
    });
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map((image) => image.decode().catch(() => undefined)));
    });
    const pdf = await page
      .locator(`meta[name="${PROPERTY_SHEET_PDF_META}"]`)
      .getAttribute("content");
    if (pdf === null || !PROPERTY_SHEET_PDF_PATH.test(pdf)) {
      throw new Error(`${urlPath}: missing or invalid ${PROPERTY_SHEET_PDF_META} meta (${pdf})`);
    }
    const brokenImages = await page.evaluate(
      () => [...document.images].filter((image) => image.naturalWidth === 0).length,
    );
    const target = path.join(DIST, ...pdf.split("/"));
    await mkdir(path.dirname(target), { recursive: true });
    await page.pdf({ path: target, format: "A4", printBackground: true, preferCSSPageSize: true });
    return { pdf, brokenImages };
  } finally {
    await page.close();
  }
}

async function main(): Promise<void> {
  const pages = await sourcePages();
  if (pages.length === 0) {
    console.log("[property-sheets] no sheet sources in dist, nothing to print");
    return;
  }

  const browser = await chromium.launch().catch((error: unknown) => {
    throw new Error(
      "[property-sheets] Chromium is not available. Install it with `bunx playwright install chromium`.",
      { cause: error },
    );
  });
  try {
    const context = await browser.newContext();
    await serveDist(context);
    const queue = [...pages];
    const worker = async (): Promise<void> => {
      for (let urlPath = queue.shift(); urlPath !== undefined; urlPath = queue.shift()) {
        const { pdf, brokenImages } = await printSheet(context, urlPath);
        // A missing photo or map tile must not block a deploy, but it must be visible.
        if (brokenImages > 0) {
          console.warn(`[property-sheets] ${pdf}: ${brokenImages} image(s) failed to load`);
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, pages.length) }, worker));
  } finally {
    await browser.close();
  }

  await rm(SOURCE_ROOT, { recursive: true, force: true });
  console.log(`[property-sheets] printed ${pages.length} PDF(s), removed the HTML sources`);
}

await main();
