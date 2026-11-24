import AxeBuilder from "@axe-core/playwright";
import type { Locator, Page } from "@playwright/test";
import { INTRO_SEEN_KEY } from "../../src/shared/ui/motion/intro";

/** Marks the brand intro as already seen so it never covers the page under test. */
export async function skipIntro(page: Page): Promise<void> {
  await page.addInitScript((key) => {
    try {
      window.sessionStorage.setItem(key, "1");
    } catch {
      // Storage blocked: the intro may show; tests that care handle it explicitly.
    }
  }, INTRO_SEEN_KEY);
}

/**
 * Axe measures what the browser lays out. Scroll-reveal fades content in (text mid-fade scores
 * 1.1:1) and `content-visibility: auto` sections skip their layout until scrolled to (their
 * contents then overlap the next section), so scans run with the motion off and every section
 * rendered: the final state a visitor reaches.
 */
async function showFinalState(page: Page): Promise<void> {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addStyleTag({ content: ".defer-render { content-visibility: visible !important; }" });
}

/** Every WCAG 2.0 to 2.2 A/AA violation, any impact: contrast exceptions are not allowed. */
export async function wcagViolations(page: Page): Promise<string[]> {
  await showFinalState(page);
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .exclude("iframe")
    .analyze();
  return results.violations.map(
    (violation) =>
      `${violation.id} (${violation.impact ?? "n/a"}): ${violation.nodes
        .map((node) => node.target.join(" "))
        .join(", ")}`,
  );
}

/** Serious/critical axe violations as readable strings (expect an empty array). */
export async function blockingAxeViolations(page: Page): Promise<string[]> {
  await showFinalState(page);
  const results = await new AxeBuilder({ page }).analyze();
  return results.violations
    .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
    .map(
      (violation) =>
        `${violation.id}: ${violation.nodes.map((node) => node.target.join(" ")).join(", ")}`,
    );
}

/**
 * Computed colour as `rgba(r, g, b, a)` whatever notation the browser reports (Chrome prints
 * `color(srgb ...)` for mixed colours), so specs can compare it with plain rgb values.
 */
export async function computedRgba(locator: Locator, property: string): Promise<string> {
  return locator.evaluate((element, name) => {
    const context = document.createElement("canvas").getContext("2d");
    if (context === null) return "";
    context.clearRect(0, 0, 1, 1);
    context.fillStyle = getComputedStyle(element).getPropertyValue(name);
    context.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
    return `rgba(${r}, ${g}, ${b}, ${Math.round(((a ?? 0) / 255) * 100) / 100})`;
  }, property);
}
