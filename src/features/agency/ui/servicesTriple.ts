/** Home services "accordion of three" (reference `home-v20.js`): three cards open, the rest are tabs. */
export const OPEN_COUNT = 3;

const clamp = (value: number, last: number): number => Math.max(0, Math.min(last, value));

/** First open card after clicking tab `index`: a tab before the window opens as the first, after it as the last. */
export function startAfterTab(index: number, start: number, count: number): number {
  const next = index < start ? index : index - OPEN_COUNT + 1;
  return clamp(next, count - OPEN_COUNT);
}

/** First open card after an arrow: pages by three and wraps from one end to the other. */
export function startAfterArrow(direction: "prev" | "next", start: number, count: number): number {
  const last = count - OPEN_COUNT;
  if (direction === "next") return start >= last ? 0 : clamp(start + OPEN_COUNT, last);
  return start <= 0 ? last : clamp(start - OPEN_COUNT, last);
}

/** Wires one `[data-services-triple]` root; every listener dies with its DOM on the next swap. */
export function initServicesTriple(root: HTMLElement): void {
  if (root.dataset["ready"] !== undefined) return;
  root.dataset["ready"] = "";
  const panels = [...root.querySelectorAll<HTMLElement>("[data-panel]")];
  let start = 0;

  const draw = (): void => {
    panels.forEach((panel, index) => {
      const on = index >= start && index < start + OPEN_COUNT;
      panel.toggleAttribute("data-on", on);
      panel.querySelector("[data-tab]")?.setAttribute("aria-expanded", String(on));
    });
  };

  panels.forEach((panel, index) => {
    const tab = panel.querySelector<HTMLElement>("[data-tab]");
    tab?.addEventListener("click", () => {
      start = startAfterTab(index, start, panels.length);
      draw();
      if (document.activeElement === tab)
        panel.querySelector<HTMLElement>("[data-card]")?.focus({ preventScroll: true });
    });
  });
  root.addEventListener("click", (event) => {
    const arrow =
      event.target instanceof Element ? event.target.closest<HTMLElement>("[data-arrow]") : null;
    if (arrow === null) return;
    start = startAfterArrow(
      arrow.dataset["arrow"] === "next" ? "next" : "prev",
      start,
      panels.length,
    );
    draw();
  });
  draw();
}
