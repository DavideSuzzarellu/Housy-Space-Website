import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
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

/** Every WCAG 2.0 to 2.2 A/AA violation, any impact: contrast exceptions are not allowed. */
export async function wcagViolations(page: Page): Promise<string[]> {
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
  const results = await new AxeBuilder({ page }).analyze();
  return results.violations
    .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
    .map(
      (violation) =>
        `${violation.id}: ${violation.nodes.map((node) => node.target.join(" ")).join(", ")}`,
    );
}
