import { motionAllowed } from "@/shared/ui/motion/reveal";

/** Count-up of the home figures (reference `cifras-home.js`): 0 → N in 1.4 s, cubic ease-out. */
export const COUNT_DURATION_MS = 1400;

/** Value shown `elapsedMs` into the animation. */
export function countAt(target: number, elapsedMs: number, durationMs: number): number {
  const progress = durationMs <= 0 ? 1 : Math.min(1, Math.max(0, elapsedMs / durationMs));
  return Math.round(target * (1 - (1 - progress) ** 3));
}

function run(element: HTMLElement, target: number): void {
  let start: number | undefined;
  const step = (now: number): void => {
    start ??= now;
    element.textContent = String(countAt(target, now - start, COUNT_DURATION_MS));
    if (now - start < COUNT_DURATION_MS) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/**
 * The final value is in the HTML (no JS, reduced motion, screen readers via a sibling
 * `.sr-only` copy); with motion allowed the visible number restarts from 0 once on screen.
 */
export function initStatsCount(): void {
  if (!motionAllowed()) return;
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting || !(entry.target instanceof HTMLElement)) continue;
        io.unobserve(entry.target);
        run(entry.target, Number(entry.target.dataset["count"]));
      }
    },
    { threshold: 0.4 },
  );
  for (const element of document.querySelectorAll<HTMLElement>("[data-count]")) {
    element.textContent = "0";
    io.observe(element);
  }
}
