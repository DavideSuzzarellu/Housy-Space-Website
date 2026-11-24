/**
 * Lifetime of the current page for scripts bound on `astro:page-load` (AGENTS.md §3.3).
 * Module scripts run once, but their page-load callback runs for every page of a client-side
 * navigation: anything attached to `document`/`window`/`matchMedia` there leaks one more copy per
 * visit unless it is tied to this signal (`{ signal: pageSignal() }`), which aborts on the swap.
 */
export function pageSignal(): AbortSignal {
  const controller = new AbortController();
  document.addEventListener("astro:before-swap", () => controller.abort(), { once: true });
  return controller.signal;
}
