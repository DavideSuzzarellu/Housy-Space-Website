---
name: page-restyle
description: "Trigger: restyle a page, match the reference site, adapt a page to the client's HTML, compare with the reference. Make a project page look and read exactly like the client's static reference site, CSS-first, fast, accessible and measured in Chrome."
when_to_use: "Any task that adapts an existing page (texts + styles + layout) to the reference repo `housyspace-web-ref`: header/footer shared parts are already done; per-page work uses this."
metadata:
  author: "housyspace"
  version: "1.0"
---

# Page restyle (match the reference site)

## Activation Contract

Load for every page that must match the client's static reference site (plain HTML/CSS/JS, cloned at `C:\Users\Utente\Desktop\housyspace-web-ref`, commit `ef59e52`). Also load `tailwind-css`, `new-component`, `testing-tdd`, `commit-per-task`, `astro-best-practices`, `localized-page` (when content/routes change). `AGENTS.md` wins over this file.

## Rule of truth

UI parity rule (`AGENTS.md` §11, mandatory): the page must end EXACTLY equal to the reference's current `HEAD` at 1440, 820 and 390: sections, order, copy, sizes, spacing, colours, interactions, animations. The only exceptions are AA contrast/focus, privacy and legal, real data, the 4 locales/routes and reduced motion, each noted in the commit body. Never leave a reference element or interaction "not ported" as a final state; report it as an open item and implement it. The reference's RENDERED CSS wins over the design-system docs (`docs/design-system/`) and over earlier assumptions. Measure it in Chrome; do not trust a README. Home, properties, services detail, header, footer, buttons, tokens, global uppercase, heading weights, `stone` alternate surface and the brand logo are already aligned: reuse them, never redo them.

## Hard scope (from the user, non-negotiable)

- Only texts, styles/layout and performance of the assigned pages.
- NEVER touch: Mobilia API code (loaders, schemas, mappers, fixtures, use cases, domain, filter/query logic), the reviews code (`src/features/reviews/**`), SEO (SeoHead, JSON-LD, hreflang, canonical, sitemap, page `title`/`description`), slugs/routes/redirects, lead-form submission logic. Real data (properties, reviews) is never replaced by the reference's demo data; demo banners/badges are never ported.
- Privacy rules of `AGENTS.md` §5 stay (approximate location only).
- Legal, tax and financial copy is client copy: copy it verbatim; never "improve" or invent.

## CSS and Tailwind FIRST; JavaScript when the reference needs it

Zero JS by default (`AGENTS.md` §3) EXCEPT where the reference itself does it with a script (steppers, popups, counters, parallax, animated SVG): there the behaviour is reproduced (UI parity). Before adding or keeping a client script, state in the commit body whether CSS/HTML can give the identical result; if it cannot, add the smallest lazy script. Prefer: `:has()`, container queries, `details/summary`, `:focus-within`, `@property`, `@starting-style`, scroll-driven animations (`animation-timeline`) behind `@supports` with a readable static fallback, `content-visibility: auto` below the fold, and build-time work in Astro frontmatter (e.g. split text in the template). A needed script runs on `astro:page-load`, loads lazily, and stays tiny (estimate gzip with esbuild; budgets in `tests/e2e/performance.spec.ts`). No new dependencies.

## Performance (use Astro's tools)

Every photo/illustration through `<Picture {...PHOTO_PICTURE}>` (AVIF + WebP) with correct `widths`/`sizes` and `width`/`height`; exactly ONE eager `fetchpriority="high"` image per page; the rest `loading="lazy"` + `decoding="async"`. Animate only `transform`/`opacity`; no permanent `will-change`; everything off under `prefers-reduced-motion`. Video only where already in use (small encodes, started when idle). Missing images needed by the page may be copied from `housyspace-web-ref/assets/img/` into `src/assets/` with the same name and recorded in `docs/media-credits.md`; never invent images.

## Accessibility (WCAG 2.2 AA)

Our colour rules win over the reference: NO exceptions. When a reference colour fails AA (text 4.5:1, graphics and UI 3:1), use the nearest passing token (`muted` on stone is `#5a6462`, `taupe-tx` is `#6b6155`, units on stone use `petrol`, chart series `ch-b`/`ch-c` are `#9a7b4c`/`#6f7c79`) and say so in the commit body. Compute the ratios (do not eyeball). Focus rings use the `accent` role. Never colour-only states.

## Texts and i18n

Spanish text comes from the reference verbatim. Carry every change faithfully into en/it/ca (UI strings in `src/shared/i18n/*` dictionaries; editorial copy in `src/content/**` JSON). Headings mark their light part with `*asterisks*`. If a schema field is added, change the Zod schema, `.pages.yml` and tests together (a test checks they match).

## URLs (SEO-critical)

Route segments are translated per locale and live ONLY in `src/shared/i18n/routes.ts`. Build every URL with `getLocalizedPath(routeKey, locale, params)` (or `getServicesAnchorPath`); never concatenate or hardcode a path in a component, a JSON link or a test. The language of the page must generate its URL.

## Tooling

- Reference server: `bun scripts/serve-reference.ts C:/Users/Utente/Desktop/housyspace-web-ref 4500` (background). The project: the user's dev server `http://localhost:4321/Housy-Space-Website/es/...`; in a worktree start your own on a free port (`bun run dev --port <n>`), after `bun install --frozen-lockfile` and copying the gitignored `.env` from the main checkout (never print its values).
- `chrome-devtools` CLI (`C:\Users\Utente\.claude\skills\chrome-devtools-cli\SKILL.md`): create YOUR OWN page (`new_page`), `resize_page <id> 1440 900` and 390x844 (if `resize_page` is ignored use `emulate <id> --viewport 390x844`), `evaluate_script "<arrow fn>" --pageId <id>` for computed styles/rects/text, `take_screenshot ... --filePath <ABSOLUTE path outside the repo>` (a relative path saves INSIDE the repo: never). Wait ~6 s after navigation. Compare per section: top/height/background, heading size/weight/case, buttons, cards, images, then diff all visible texts.
- Never run a build (`bun run build`, `astro build`). Allowed: `bun run test`, `bun run check` (0 errors), `bun run lint`, `bunx prettier --write <files>`, `bunx vitest run <file>`.

## Procedure

1. Comparison pass first, NO code changes: reference vs project at 1440 and 390 for each assigned page; list differences.
2. Fix in small steps, one commit each (conventional commits, no AI attribution, never `Co-Authored-By`). TDD red/green for any new logic. After each step: prettier + test + check + lint green, re-measure, put before/after numbers in the commit body. Stage only the files you changed with explicit `git add <paths>`; never stage `.agents/`, `.claude/settings.json`, `skills-lock.json`, `*.zip`.
3. Shared files (`global.css`, `Button`, `Header`, `Footer`, tokens): change only when the page truly needs it, minimal, in its OWN commit, so it can be merged first.
4. Statically update e2e specs for what you changed (`test(e2e)` commit; Playwright cannot be run without a build).

## Output Contract

Per step: commit hash + subject, measured before/after, tests (say whether test-first), what could NOT be verified. Then: JS added/removed (gzip estimate), performance changes, copied assets, and a list of what still differs from the reference by design or needs a user decision. Save key findings to engram (`mem_save`, project `housey`).

## References

- `../../../AGENTS.md` §3, §4, §4.1, §8, §11, §13; `docs/performance.md`; `docs/design-system/`
- Skills: `tailwind-css`, `new-component`, `testing-tdd`, `commit-per-task`, `astro-best-practices`, `localized-page`, `seo-multilingual`
