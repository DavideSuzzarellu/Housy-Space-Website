import { expect, test } from "@playwright/test";
import { getLocalizedPath } from "../../src/shared/i18n/routes";
import { skipIntro } from "./support";

const home = getLocalizedPath("home", "es");

test.describe("brand intro", () => {
  test("shows once per session, is skippable with Escape and not shown again", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(home);
    const intro = page.locator("[data-intro]");
    await expect(intro).toBeVisible();
    await expect(intro).toHaveAttribute("aria-hidden", "true");
    // Content stays in the DOM underneath.
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);

    await page.keyboard.press("Escape");
    await expect(intro).toBeHidden();

    await page.reload();
    await expect(intro).toBeHidden();
    await expect(page.locator("html")).not.toHaveClass(/intro-active/);
  });

  test("can be skipped with a click and never blocks content for long", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(home);
    const intro = page.locator("[data-intro]");
    await expect(intro).toBeVisible();
    await intro.click();
    await expect(intro).toBeHidden();
  });

  test("ends on its own within the time cap", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(home);
    await expect(page.locator("[data-intro]")).toBeHidden({ timeout: 5_000 });
  });

  test("is not shown on a client-side navigation back to home", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/es/this-page-does-not-exist");
    await page.locator('main a[hreflang="es-ES"]').click();
    await expect(page).toHaveURL(home);
    await expect(page.locator("[data-intro]")).toBeHidden();
  });

  test("is disabled under prefers-reduced-motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(home);
    await expect(page.locator("[data-intro]")).toBeHidden();
    await expect(page.locator("html")).not.toHaveClass(/intro-active/);
  });
});

test.describe("scroll progress bar", () => {
  test("grows as the page scrolls", async ({ page }) => {
    await skipIntro(page);
    await page.goto(home);
    const bar = page.locator("[data-scroll-progress]");
    await expect(bar).toHaveAttribute("aria-hidden", "true");
    const widthAt = async () => (await bar.boundingBox())?.width ?? 0;

    const start = await widthAt();
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight / 2));
    await expect.poll(widthAt).toBeGreaterThan(start + 100);
    const middle = await widthAt();
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect.poll(widthAt).toBeGreaterThan(middle);
  });
});

test.describe("reduced motion", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  test("shows reveal content immediately without animation", async ({ page }) => {
    await skipIntro(page);
    await page.goto(home);
    const servicesHeading = page.locator("#services-heading");
    await expect(servicesHeading).toHaveCSS("opacity", "1");
    await expect(servicesHeading).toHaveCSS("transform", "none");
    await expect(page.locator('[data-reveal="lines"] [data-line]').first()).toHaveCSS(
      "transform",
      "none",
    );
  });
});
