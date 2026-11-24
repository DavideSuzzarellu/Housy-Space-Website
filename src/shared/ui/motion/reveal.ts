import { slugify } from "@/shared/lib/slugify";
import { sharedMorphRefs } from "@/shared/lib/transitionNames";
import { INTRO_END_EVENT, isIntroActive } from "./intro";

/**
 * The ONE scroll-reveal utility (AGENTS.md §11.1): a single IntersectionObserver that adds
 * `is-revealed` to `[data-reveal]` elements (`""` fade-up, `"fade"`, `"lines"` for the
 * line-by-line heading). Hidden states only apply under `html.motion-ready` and
 * `prefers-reduced-motion: no-preference` (see motion.css), so content is never lost
 * without JS or with reduced motion.
 */

export const MOTION_READY_CLASS = "motion-ready";
const REVEALED_CLASS = "is-revealed";

let observer: IntersectionObserver | undefined;

export function motionAllowed(): boolean {
  return (
    "IntersectionObserver" in window &&
    window.matchMedia("(prefers-reduced-motion: no-preference)").matches
  );
}

function reveal(element: Element): void {
  element.classList.add(REVEALED_CLASS);
}

/** What the reference site reveals on its own (v2.js): headings, page-head lead, steps, figures, folds. */
export const AUTO_REVEAL_SELECTOR =
  "main section h2, [data-page-head] p, main ol > li, main figure, main details, main aside";
/** Never auto-reveal inside navigation, the shared chrome or carousels (off-screen panels must stay visible). */
const AUTO_REVEAL_EXCLUDED =
  "nav, header, footer, [data-services-accordion], .progress-step, .sr-only";

/** Sibling stagger of the reference: 0.09 s per element, at most 0.45 s. */
export const staggerDelay = (index: number): number => Math.min(Math.round(index * 9) / 100, 0.45);

/** Marks the reference's automatic targets and staggers siblings, so no page needs its own markers. */
function markAutoReveal(): void {
  const seen = new Map<Element, number>();
  for (const element of document.querySelectorAll<HTMLElement>(AUTO_REVEAL_SELECTOR)) {
    if (element.hasAttribute("data-reveal") || element.closest(AUTO_REVEAL_EXCLUDED) !== null) {
      continue;
    }
    element.setAttribute("data-reveal", "");
    const parent = element.parentElement;
    if (parent === null) continue;
    const index = seen.get(parent) ?? 0;
    seen.set(parent, index + 1);
    if (index > 0) element.style.setProperty("--reveal-delay", `${staggerDelay(index)}s`);
  }
}

export function initReveal(): void {
  observer?.disconnect();
  markAutoReveal();
  const targets = [...document.querySelectorAll(`[data-reveal]:not(.${REVEALED_CLASS})`)];

  if (!motionAllowed()) {
    document.documentElement.classList.remove(MOTION_READY_CLASS);
    targets.forEach(reveal);
    return;
  }

  document.documentElement.classList.add(MOTION_READY_CLASS);
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        reveal(entry.target);
        io.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.01 },
  );
  observer = io;

  const start = (): void => {
    for (const target of targets) io.observe(target);
  };
  if (isIntroActive()) {
    document.addEventListener(INTRO_END_EVENT, start, { once: true });
  } else {
    start();
  }
}

function morphRefs(root: ParentNode): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>("[data-morph-ref]")];
}

/**
 * Before a client-side swap: elements that morph from the outgoing page (card ↔ detail)
 * must be visible in the incoming snapshot, so their scroll-reveal wrapper starts revealed.
 */
export function revealMorphTargets(outgoing: Document, incoming: Document): void {
  const ref = (element: HTMLElement): string => element.dataset["morphRef"] ?? "";
  const targets = morphRefs(incoming);
  const shared = sharedMorphRefs(morphRefs(outgoing).map(ref), targets.map(ref));
  for (const element of targets) {
    if (shared.has(slugify(ref(element)))) {
      element.closest("[data-reveal]")?.classList.add(REVEALED_CLASS);
    }
  }
}
