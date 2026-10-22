---
name: localized-page
description: "Trigger: new page, new route, route map, translated slug, locale page. Add a page in es/en/it/ca with route map, i18n strings, content entry, SEO and tests."
when_to_use: "Adding or renaming any route under src/pages, editing shared/i18n/routes.ts, or adding entries to the pages content collection."
metadata:
  author: "housyspace"
  version: "1.0"
---

# Localized page

## Activation Contract

Load whenever a route is added, renamed, or removed. Also load `seo-multilingual` and `testing-tdd`.

## Hard Rules

- Every page exists in all 4 locales: `es` (default, prefixed), `en`, `it`, `ca` (AGENTS.md §4, §4.1).
- Segments come from the table in §4.1. If a route key is missing there, ask for the 4 slugs; never invent translations.
- URLs only through `getLocalizedPath(routeKey, locale, params)` from `shared/i18n/routes.ts`; no string concatenation. `astro:i18n` helpers (`getRelativeLocaleUrl`) do not translate segments, so they are not a substitute.
- Slugs: lowercase, hyphenated, ASCII (strip accents), no trailing slash (`trailingSlash: "never"`).
- Pages are thin: compose components and call use cases; no data fetching, no markup blocks repeated across pages.
- All copy from `shared/i18n/{locale}.ts`; missing keys must fail the type check. Never translate legal text yourself (§13).
- Client-provided content not yet available (Services, Living in Barcelona) uses clearly marked placeholders (§6).

## Decision Gates

| Page type | Content source |
|-----------|----------------|
| Editorial/legal (services, living, about, legal) | `pages` collection: `src/content/pages/{locale}/*.md(x)`, frontmatter `routeKey`, `title`, `description`, `locale` |
| Property listing/detail | `properties` collection via `features/properties/application` use cases (skill `mobilia-loader`) |
| Team | `agents` collection via use case |
| Form submit | endpoint in `src/pages/api/` (skill `astro-best-practices`) |

## Execution Steps

1. Write failing tests first: unit test for `getLocalizedPath` returning the 4 expected paths; Playwright smoke test visiting the page in 4 locales (status 200, `<html lang>`, `<h1>`, canonical).
2. Add the route key + 4 segments to `shared/i18n/routes.ts` (single map typed by `Locale` and `RouteKey`). Type must force all 4 locales.
3. Add UI strings (title, description, headings, nav label) to `shared/i18n/{es,en,it,ca}.ts`.
4. Content page: create one file per locale in `src/content/pages/{locale}/` with matching `routeKey`; the collection uses `glob({ pattern, base: "./src/content/pages" })` and a Zod schema (`import { z } from "astro/zod"`).
5. Route file under `src/pages/[locale]/...` with `getStaticPaths()` emitting one path per locale using the route map's translated segment; read data through an application use case (`getPageByRouteKey(routeKey, locale)`), never `getCollection()` in the page body directly if a use case exists.
6. Head: pass `routeKey`, `locale`, params to the shared SEO component so it emits self canonical, 4 `hreflang` alternates, and `x-default` → `es` URL (skill `seo-multilingual`).
7. Navigation/footer: add the link via `getLocalizedPath`; verify the locale switcher resolves the counterpart page.
8. Sitemap: confirm the 4 URLs appear in the `@astrojs/sitemap` output with alternates after `pnpm build`.
9. Run `pnpm test`, `pnpm test:e2e`, `pnpm check`, `pnpm build`.

## Output Contract

Return: route key, the 4 final URLs, files added (routes map, dictionaries, content entries, page), placeholders left for the client, and test/build results.

## References

- `../../../AGENTS.md` §3, §3.2, §4, §4.1, §6, §13
- Skills: `seo-multilingual`, `testing-tdd`, `astro-best-practices`
