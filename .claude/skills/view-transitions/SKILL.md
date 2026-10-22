---
name: view-transitions
description: "Trigger: view transitions, ClientRouter, transition:name, transition:persist, page animation, morph. Implement app-like navigation with Astro View Transitions."
when_to_use: "Touching the base layout head, card-to-detail morphs, persisted header/islands, client scripts that bind DOM events, or navigation animations."
metadata:
  author: "housyspace"
  version: "1.0"
---

# View transitions

## Activation Contract

Load for any navigation, animation, persisted element, or client `<script>` work. Also load `testing-tdd`.

## Hard Rules

- `<ClientRouter />` (from `astro:transitions`) appears ONCE, in the base layout `<head>`. Never per page (AGENTS.md §3.3).
- `transition:name` values come ONLY from `src/shared/lib/transitionNames.ts`; never inline strings. Names must be unique per page.
- Animations: `fade` / `slide` from `astro:transitions` or custom ones defined once in `src/shared/ui/motion/`; 250–400 ms, ease-out, no bounce.
- Never override ClientRouter's reduced-motion handling (it disables all transition animations under `prefers-reduced-motion`).
- Scripts that bind DOM events run inside `document.addEventListener("astro:page-load", ...)`. Analytics page views fire there, only after consent.
- `LeadForm` submits via its island with `fetch` + `preventDefault`; it must not trigger router navigation.
- Transitions never delay content or cause layout shift; keep prefetch on for listing → detail links (with ClientRouter, `prefetch.prefetchAll` defaults to `true`).

## Decision Gates

| Need | Use |
|------|-----|
| Card image/title/price morph into detail | Same name on both pages from the helper (`property-${ref}-image`, `-title`, `-price`) |
| Element must keep state across pages (header, map/lead islands) | `transition:persist` (+ matching `transition:name` if the element differs between templates) |
| One element animates differently | `transition:animate="fade" \| "slide" \| "none"` or a motion preset from `shared/ui/motion/` |
| A link/form must do a full reload | `data-astro-reload` on that element only, with a comment explaining why |
| Listing shows the same ref twice (e.g. featured + grid) | Apply the morph name on one instance only; uniqueness per page wins |

## Execution Steps

1. Write failing tests first: unit test for `transitionNames.ts` (deterministic, slug-safe, unique per `ref` + part); Playwright test for listing → detail navigation.
2. Helper API (single source): e.g. `propertyTransitionName(ref, "image" | "title" | "price")`; lowercase `ref`; return only characters valid in CSS idents.
3. Apply `transition:name={propertyTransitionName(ref, "image")}` on `PropertyCard` image and the detail hero; same for title and price.
4. Header: `transition:persist` in the base layout so it stays fixed while `<main>` transitions.
5. Scripts: wrap DOM binding in `astro:page-load`; make handlers idempotent (no double-binding on persisted elements).
6. Locale switcher navigates to `getLocalizedPath(routeKey, targetLocale, params)`; after the swap assert `<html lang>` and `hreflang` links reflect the new page.
7. Accessibility: every page has a unique `<title>` (ClientRouter's route announcer reads it, then the first `<h1>`); verify focus lands sensibly after navigation.
8. Playwright checks (4 locales): morph target exists on both pages; header element is the same node after navigation; `lang` updates; form submit stays on page and shows translated status; run once with `reducedMotion: "reduce"` and assert content swaps without errors; no console errors.
9. Run `bun run test`, `bun run test:e2e`, `bun run check`.

## Output Contract

Return: names added to the helper, elements persisted, scripts moved to `astro:page-load`, tests added and results.

## References

- `../../../AGENTS.md` §3.3, §6 (LeadForm), §8
- Skills: `new-component`, `testing-tdd`
