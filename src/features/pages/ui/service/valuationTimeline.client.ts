import { pageSignal } from "@/shared/lib/pageScope";

/**
 * Timeline of the valuation service (reference servicios-v42.js): the line advances with the
 * scroll and each step lights up on reaching it. With reduced motion the line stays complete.
 */
function initTimeline(): void {
  const timeline = document.querySelector<HTMLElement>("[data-timeline]");
  if (timeline === null || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const rows = [...timeline.children].filter(
    (node): node is HTMLElement => node instanceof HTMLElement,
  );
  timeline.classList.add("live");
  let queued = false;
  const update = (): void => {
    queued = false;
    const box = timeline.getBoundingClientRect();
    const height = innerHeight || 800;
    const progress = Math.max(0, Math.min(1, (height * 0.62 - box.top) / box.height));
    timeline.style.setProperty("--p", progress.toFixed(4));
    for (const row of rows) {
      if (row.getBoundingClientRect().top < height * 0.64) row.classList.add("on");
    }
  };
  const schedule = (): void => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  };
  const signal = pageSignal();
  addEventListener("scroll", schedule, { passive: true, signal });
  addEventListener("resize", schedule, { signal });
  update();
}

document.addEventListener("astro:page-load", initTimeline);
