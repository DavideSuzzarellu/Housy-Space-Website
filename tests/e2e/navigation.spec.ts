import { expect, test } from "@playwright/test";
import { getLocalizedPath } from "../../src/shared/i18n/routes";
import { blockingAxeViolations, skipIntro } from "./support";

test.beforeEach(async ({ page }) => {
  await skipIntro(page);
});

test.describe("mobile drawer", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("opens, traps focus and closes with the keyboard", async ({ page }) => {
    await page.goto(getLocalizedPath("home", "es"));
    const menuButton = page.locator("[data-menu-button]");
    const drawer = page.getByRole("dialog", { name: "Menú de navegación" });

    await menuButton.focus();
    await page.keyboard.press("Enter");
    await expect(drawer).toBeVisible();
    await expect(menuButton).toHaveAttribute("aria-expanded", "true");
    await expect(drawer.locator("[data-drawer-close]")).toBeFocused();

    // Shift+Tab from the first element wraps to the last one inside the dialog.
    await page.keyboard.press("Shift+Tab");
    const insideAfterWrap = await page.evaluate(
      () => document.activeElement?.closest("[data-drawer]") !== null,
    );
    expect(insideAfterWrap).toBe(true);

    // Expand a group with the keyboard.
    const toggle = drawer.locator("[data-drawer-group-toggle]").first();
    await toggle.focus();
    await page.keyboard.press("Enter");
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(drawer.getByRole("link", { name: "En alquiler" })).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
    await expect(menuButton).toHaveAttribute("aria-expanded", "false");
    await expect(menuButton).toBeFocused();
  });

  test("has no serious or critical axe violations while open", async ({ page }) => {
    await page.goto(getLocalizedPath("home", "en"));
    await page.locator("[data-menu-button]").click();
    await expect(page.getByRole("dialog")).toBeVisible();
    expect(await blockingAxeViolations(page)).toEqual([]);
  });
});

test.describe("header menu fits the available width", () => {
  test("shows the menu inline when it fits and the Menu button only when it does not", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1920, height: 900 });
    await page.goto(getLocalizedPath("sale", "es"));
    const header = page.locator("[data-header]");
    const nav = page.getByRole("navigation", { name: "Navegación principal" });
    const menuButton = page.locator("[data-menu-button]");
    await expect(header).toHaveAttribute("data-nav", "full");
    await expect(nav).toBeVisible();
    await expect(menuButton).toBeHidden();

    // Narrower window: the menu no longer fits beside the logo, so it moves behind the button.
    await page.setViewportSize({ width: 900, height: 900 });
    await expect(header).toHaveAttribute("data-nav", "compact");
    await expect(nav).toBeHidden();
    await expect(menuButton).toBeVisible();

    // The inline menu never overflows into the actions next to it.
    await page.setViewportSize({ width: 1280, height: 900 });
    await expect(header).not.toHaveAttribute("data-nav", "compact");
    const overflow = await nav.evaluate((element) => {
      const list = element.querySelector(":scope > ul");
      return list === null
        ? 0
        : list.getBoundingClientRect().right - element.getBoundingClientRect().right;
    });
    expect(overflow).toBeLessThanOrEqual(1);
  });
});

test.describe("desktop main menu", () => {
  test.use({ viewport: { width: 1600, height: 900 } });

  test("opens a submenu with its toggle button and closes it with Escape", async ({ page }) => {
    await page.goto(getLocalizedPath("home", "es"));
    const nav = page.getByRole("navigation", { name: "Navegación principal" });
    const toggle = nav.getByRole("button", { name: "Abrir el submenú Servicios" });
    await toggle.focus();
    await page.keyboard.press("Enter");
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(nav.getByRole("link", { name: "Interiorismo" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle).toBeFocused();
  });
});
