/**
 * Brand intro overlay on the home page (UI proposal §11.1).
 * - Only on the first HARD load of the browser session (sessionStorage), never after a
 *   client-side navigation, never under prefers-reduced-motion.
 * - The decision runs before first paint (inline script in `IntroOverlay.astro`), which adds
 *   `intro-active` to <html>; this module ends it: click, Escape or automatically.
 * - Content stays in the DOM underneath; the overlay is aria-hidden.
 */

export const INTRO_SEEN_KEY = "hs-intro-seen";
export const INTRO_ACTIVE_CLASS = "intro-active";
/** Event fired when the intro starts fading out; scroll reveals wait for it. */
export const INTRO_END_EVENT = "hs:intro-end";
/** Hard cap: the intro never blocks content longer than this. */
export const INTRO_AUTO_END_MS = 2400;
export const INTRO_FADE_MS = 800;

export interface IntroConditions {
  readonly seen: boolean;
  readonly reducedMotion: boolean;
  readonly clientNavigation: boolean;
}

export function shouldPlayIntro({
  seen,
  reducedMotion,
  clientNavigation,
}: IntroConditions): boolean {
  return !seen && !reducedMotion && !clientNavigation;
}

function markSeen(): void {
  try {
    sessionStorage.setItem(INTRO_SEEN_KEY, "1");
  } catch {
    // Storage unavailable (private mode, blocked): the intro simply may show again.
  }
}

export function isIntroActive(): boolean {
  return document.documentElement.classList.contains(INTRO_ACTIVE_CLASS);
}

export function initIntro(): void {
  const html = document.documentElement;
  const overlay = document.querySelector<HTMLElement>("[data-intro]");
  if (overlay === null || !isIntroActive()) {
    html.classList.remove(INTRO_ACTIVE_CLASS);
    return;
  }

  let ended = false;
  const controller = new AbortController();

  const end = (): void => {
    if (ended) return;
    ended = true;
    controller.abort();
    markSeen();
    overlay.dataset["done"] = "true";
    document.dispatchEvent(new CustomEvent(INTRO_END_EVENT));
    window.setTimeout(() => html.classList.remove(INTRO_ACTIVE_CLASS), INTRO_FADE_MS);
  };

  overlay.addEventListener("click", end, { signal: controller.signal });
  document.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Escape") end();
    },
    { signal: controller.signal },
  );
  // Leaving the page before the intro ends must not leave the overlay behind.
  document.addEventListener("astro:before-swap", end, { signal: controller.signal });
  window.setTimeout(end, INTRO_AUTO_END_MS);
}
