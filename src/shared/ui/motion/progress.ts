/**
 * Top scroll-progress bar (decorative). Prefers a CSS scroll-driven animation
 * (`animation-timeline: scroll()`, zero JS work per frame); falls back to one passive,
 * rAF-throttled scroll listener. Under reduced motion it uses the JS path (no transitions).
 */

export interface ScrollMetrics {
  readonly scrollTop: number;
  readonly scrollHeight: number;
  readonly viewportHeight: number;
}

export function scrollProgress({ scrollTop, scrollHeight, viewportHeight }: ScrollMetrics): number {
  const scrollable = scrollHeight - viewportHeight;
  if (scrollable <= 0) return 0;
  return Math.min(1, Math.max(0, scrollTop / scrollable));
}

const SELECTOR = "[data-scroll-progress]";
let listening = false;
let frame = 0;

function update(): void {
  frame = 0;
  const bar = document.querySelector<HTMLElement>(SELECTOR);
  if (bar === null || bar.dataset["mode"] !== "js") return;
  const root = document.documentElement;
  const progress = scrollProgress({
    scrollTop: window.scrollY,
    scrollHeight: root.scrollHeight,
    viewportHeight: window.innerHeight,
  });
  bar.style.transform = `scaleX(${progress.toFixed(4)})`;
}

function schedule(): void {
  if (frame === 0) frame = window.requestAnimationFrame(update);
}

export function initScrollProgress(): void {
  const bar = document.querySelector<HTMLElement>(SELECTOR);
  if (bar === null) return;
  const cssDriven =
    CSS.supports("animation-timeline: scroll()") &&
    window.matchMedia("(prefers-reduced-motion: no-preference)").matches;
  bar.dataset["mode"] = cssDriven ? "css" : "js";
  if (cssDriven) return;
  if (!listening) {
    listening = true;
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
  }
  schedule();
}
