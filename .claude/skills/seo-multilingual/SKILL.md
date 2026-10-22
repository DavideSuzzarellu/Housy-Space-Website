---
name: seo-multilingual
description: "Trigger: SEO, metadata, canonical, hreflang, x-default, JSON-LD, sitemap, slug, redirect, 301, Open Graph. Implement multilingual SEO rules for the 4 locales."
when_to_use: "Editing the shared head/SEO component, property detail slugs or redirects, structured data, sitemap or robots.txt config."
metadata:
  author: "housyspace"
  version: "1.0"
---

# SEO multilingual

## Activation Contract

Load for any metadata, URL, redirect, structured-data, or sitemap work. Rules source: AGENTS.md §4, §4.1, §8.

## Hard Rules

- One shared SEO head component emits everything below; pages pass `routeKey`, `locale`, `params`, `title`, `description`, image. No per-page hand-written head tags.
- `<html lang>`: `es-ES`, `en`, `it-IT`, `ca-ES` (§4). The same codes are used for `hreflang`.
- Self-referencing absolute `canonical` (requires `site` in config). Listing filter query params: canonical → unfiltered listing.
- `hreflang` alternates for all 4 locales + `x-default` → the `/es/...` URL. Build every URL with `getLocalizedPath` (never concatenation).
- Slugs: lowercase, hyphenated, ASCII, accents stripped, no trailing slash. Property detail = `{slug}-{ref}`; `{slug}` from the localized title, ~60 chars max; `{ref}` = `referencia` lowercased and is the ONLY lookup key (§4.1).
- One slugify function in `shared/lib`; reused everywhere.
- Never invent company data in JSON-LD: use only confirmed data from §1 (name, address, AICAT 14032, domain). Leave out unknown fields.
- No automatic language redirect by browser language or IP (§4.1).

## Decision Gates

| Request | Response |
|---------|----------|
| `/` | 301 → `/es` (§4.1; true 301 needs adapter or host rules, otherwise ask) |
| Valid ref, outdated slug | 301 → current slug URL |
| Ref in `/inmuebles/desactivados` | 301 → its operation listing (`sale`/`rent` route key) |
| Unknown ref | 404 |
| Property for sale AND rent | One canonical URL per operation |
| Filtered or paginated listing beyond page 1 | Canonical → unfiltered; `noindex,follow` policy is `TODO` (§4.1): ask |
| Zone landing pages | Not MVP (§4.1): do not build |

Note: the redirect rows for detail pages need per-request logic or generated redirect rules; with static output and no adapter, ask how to implement before coding.

## Execution Steps

1. Write failing tests first: unit tests for slugify (accents, length, ASCII), `getLocalizedPath` for detail params, hreflang/canonical builder output; Playwright check of head tags in 4 locales.
2. Metadata: `<title>`, meta description (from i18n or localized content), Open Graph (`og:title`, `og:description`, `og:image` PNG from `public/brand/` or the property photo, `og:locale`), Twitter card if needed.
3. JSON-LD (`<script type="application/ld+json">`, serialized with `JSON.stringify`, built by typed helpers in `shared/lib/seo`):
   - Site-wide: `RealEstateAgent` with confirmed name, address (Travessera de Gràcia 73, 2.º 3.ª, 08006 Barcelona), URL.
   - Property detail: `Residence` (or a more specific type if mapped) + `Offer` with `price`/`priceCurrency` only when price is public; omit price when `precio*AConsultar` is true. Never include private address when `mostrarDireccionExacta` is false.
4. Sitemap: `@astrojs/sitemap` with `i18n: { defaultLocale: "es", locales: { es: "es-ES", en: "en", it: "it-IT", ca: "ca-ES" } }`; exclude API routes and redirect-only paths.
5. `robots.txt` references the sitemap index; do not block assets needed for rendering.
6. After `bun run build`, inspect generated head of one page per locale and the sitemap for alternates.
7. Run `bun run test`, `bun run test:e2e`, `bun run build`.

## Output Contract

Return: head fields emitted, JSON-LD types and fields (no invented data), redirect rules added and how they are served, sitemap/robots changes, test results.

## References

- `../../../AGENTS.md` §1, §4, §4.1, §5, §7, §8
- Skills: `localized-page`, `astro-best-practices`, `testing-tdd`
