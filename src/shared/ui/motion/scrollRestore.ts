/**
 * Accurate scroll restoration on back/forward.
 * Below-the-fold sections use `content-visibility: auto` (`.defer-render`): until they are rendered
 * once, the browser reserves a guessed height, so a freshly swapped page is shorter or taller than
 * the one the visitor left and the router restores the saved position to the wrong place (or clamps
 * it). On history navigations the incoming page is laid out in full for the swap and returns to
 * normal right after the position was restored (global.css, `.restore-layout`).
 */

export const RESTORE_LAYOUT_CLASS = "restore-layout";

export function isHistoryDirection(direction: string): boolean {
  return direction === "back" || direction === "forward";
}

/** Bound once by the base layout, like the other motion modules. */
export function initScrollRestore(): void {
  document.addEventListener("astro:before-swap", (event) => {
    if (isHistoryDirection(event.direction)) {
      event.newDocument.documentElement.classList.add(RESTORE_LAYOUT_CLASS);
    }
  });
  document.addEventListener("astro:page-load", () => {
    const root = document.documentElement;
    if (!root.classList.contains(RESTORE_LAYOUT_CLASS)) return;
    // Two frames: the restored position is painted before sections may skip rendering again.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => root.classList.remove(RESTORE_LAYOUT_CLASS)),
    );
  });
}
