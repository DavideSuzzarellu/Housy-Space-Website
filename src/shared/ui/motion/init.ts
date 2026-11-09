import { initIntro } from "./intro";
import { initScrollProgress } from "./progress";
import { initReveal, MOTION_READY_CLASS, motionAllowed, revealMorphTargets } from "./reveal";

declare global {
  interface Window {
    /** Set after the first `astro:page-load`; later loads are client-side navigations. */
    __hsBooted?: boolean;
  }
}

/**
 * Site-wide motion bootstrap, imported once by the base layout. Module scripts run once;
 * per-page work happens on `astro:page-load` (AGENTS.md §3.3).
 */
document.addEventListener("astro:page-load", () => {
  initIntro();
  initReveal();
  initScrollProgress();
  window.__hsBooted = true;
});

// ClientRouter replaces <html> attributes on swap: restore the motion flag before the new
// page paints so revealed-on-scroll content does not flash.
document.addEventListener("astro:after-swap", () => {
  if (motionAllowed()) document.documentElement.classList.add(MOTION_READY_CLASS);
});

// Card ↔ detail morphs: the incoming morph targets must not be hidden by the scroll reveal.
document.addEventListener("astro:before-swap", (event) => {
  revealMorphTargets(document, event.newDocument);
});
