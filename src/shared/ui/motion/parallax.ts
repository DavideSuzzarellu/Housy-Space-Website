/**
 * Image parallax of the reference (v2.js): an image marked `data-par="0.08"` inside a clipping host
 * moves with the scroll, never more than 5.5 % of the host height. The offset is written to `--py`
 * (the image uses `translate: 0 var(--py)`), so only a compositor property changes.
 */

/** Pixels the image is shifted: opposite to how far the host centre is from the viewport centre. */
export function parallaxOffset(
  hostTop: number,
  hostHeight: number,
  viewportHeight: number,
  factor: number,
): number {
  const limit = hostHeight * 0.055;
  const shift = -(hostTop + hostHeight / 2 - viewportHeight / 2) * factor;
  return Math.max(-limit, Math.min(limit, shift));
}

let frame = 0;
let bound = false;

function update(): void {
  frame = 0;
  const vh = window.innerHeight;
  document.querySelectorAll<HTMLElement>("[data-par]").forEach((image) => {
    const host = image.closest<HTMLElement>("[data-par-host]") ?? image.parentElement;
    if (host === null) return;
    const rect = host.getBoundingClientRect();
    if (rect.bottom < -120 || rect.top > vh + 120) return;
    const factor = Number.parseFloat(image.dataset["par"] ?? "") || 0.08;
    image.style.setProperty(
      "--py",
      `${parallaxOffset(rect.top, rect.height, vh, factor).toFixed(1)}px`,
    );
  });
}

function schedule(): void {
  if (frame === 0) frame = requestAnimationFrame(update);
}

/** Called on every `astro:page-load`; the scroll listener is bound once. */
export function initParallax(): void {
  if (!window.matchMedia("(prefers-reduced-motion: no-preference)").matches) return;
  if (!bound) {
    bound = true;
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
  }
  update();
}
