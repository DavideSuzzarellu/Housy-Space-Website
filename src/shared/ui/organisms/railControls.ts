/** Prev/next buttons for a native scroll rail: `[data-rail-step="-1|1"][data-rail-for="<rail id>"]`. */

const TOLERANCE_PX = 2;
const STEP_RATIO = 0.8;

/** Whether the rail sits at its first or last position (sub-pixel rounding tolerated). */
export function railEdges(
  scrollLeft: number,
  clientWidth: number,
  scrollWidth: number,
): { readonly atStart: boolean; readonly atEnd: boolean } {
  return {
    atStart: scrollLeft <= TOLERANCE_PX,
    atEnd: scrollLeft >= scrollWidth - clientWidth - TOLERANCE_PX,
  };
}

/** Wires every unwired step button to its rail; safe to call on each `astro:page-load`. */
export function initRailControls(): void {
  const buttons = [...document.querySelectorAll<HTMLButtonElement>("[data-rail-step]")];
  const rails = new Map<HTMLElement, HTMLButtonElement[]>();
  for (const button of buttons) {
    if (button.dataset["ready"] !== undefined) continue;
    button.dataset["ready"] = "";
    const rail = document.getElementById(button.dataset["railFor"] ?? "");
    if (rail === null) continue;
    rails.set(rail, [...(rails.get(rail) ?? []), button]);
    button.addEventListener("click", () => {
      const direction = Number(button.dataset["railStep"]);
      rail.scrollBy({ left: direction * rail.clientWidth * STEP_RATIO, behavior: "smooth" });
    });
  }
  for (const [rail, steps] of rails) {
    const sync = (): void => {
      const { atStart, atEnd } = railEdges(rail.scrollLeft, rail.clientWidth, rail.scrollWidth);
      for (const button of steps)
        button.disabled = button.dataset["railStep"] === "1" ? atEnd : atStart;
    };
    rail.addEventListener("scroll", sync, { passive: true });
    sync();
  }
}
