# SEO

How the site's search metadata is produced and checked. Rules live in `AGENTS.md` §4, §4.1, §8 and the skill `seo-multilingual`; this file records what is implemented and how to verify it.

## Head of every page

One component, `shared/ui/organisms/SeoHead.astro` (through `BaseLayout`), emits all of it. Pages pass `title`, `description`, `alternates` (from `getAlternates`, which already carries the site base) and optionally `ogImage`, `ogType`, `noindex`.

| Tag                      | Value                                                                                                         |
| ------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `<html lang>`            | `es-ES`, `en`, `it-IT`, `ca-ES`                                                                               |
| `<title>`, `description` | Per page and locale (see "Where the copy lives"). Brand suffix ` · HousySpace`                                |
| `canonical`              | Absolute, self-referencing; listing filters (`?zona=...`) never change it                                     |
| `hreflang`               | The 4 locales plus `x-default` → `/es/...`; a blog post lists only its own language plus `x-default` → itself |
| `og:*`, `twitter:card`   | Title, description, locale (+ alternates), url, image; card `summary_large_image`                             |
| `robots`                 | Only `noindex,follow` where the page must stay out (404, untranslated fallback, data sources page)            |

Open Graph image per page type: home = hero poster, about = office photo, district and barrio = the district photo (all cropped to 1200×630 JPEG by `getOgImagePath`), blog post = its own image, property = first Mobilia photo, everything else = the logo PNG in `public/brand` (3400×1407, white background; no 1200×630 brand card exists yet).

## Where the copy lives

- Editorial pages (services, about, contact, blog, legal, valuation, my search...): `title` and `description` at the top of `src/content/pages/{key}.{locale}.json` (editable in Pages CMS).
- Home, listings, 404, property detail template, zones index and zone templates: `shared/i18n/{locale}.ts` (`home`, `catalog`, `notFound`, `property.detail`, `zones`).
- District and barrio: `features/districts/application/zoneMeta.ts` builds title and description from the dictionary templates plus the zone's own `lead` (from `src/content/market/text`). No figure is written into the text.
- Spanish source: the client's `tools/seo/config.json`, verbatim where the page exists there.

## Structured data (JSON-LD)

Built by typed helpers in `shared/lib/seo/structuredData.ts`, serialized by `JsonLd.astro`. Only confirmed company data (`AGENTS.md` §1): legal name, CIF, AICAT 14032, Travessera de Gràcia 73, domain. No phone, e-mail, hours, social profiles, ratings or reviews.

| Page                                 | Nodes                                                                                                                                           |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Home                                 | `RealEstateAgent` (`@id` `/#organization`: name, alternateName, legalName, taxID, AICAT as `identifier`, address, areaServed, logo) + `WebSite` |
| Services index, listings, blog index | `CollectionPage` + `BreadcrumbList`                                                                                                             |
| About, contact                       | `AboutPage` / `ContactPage` + `BreadcrumbList`                                                                                                  |
| Service page                         | `WebPage` + `BreadcrumbList` + `Service` (provider = organisation by `@id`) + `FAQPage` when the page shows `faq` items                         |
| District, barrio                     | `WebPage` + `BreadcrumbList` + `AdministrativeArea` (name, description, containing area; no `geo`)                                              |
| Property detail                      | `Apartment`/`Residence` + `Offer` + `BreadcrumbList`; locality only, no street, no coordinates                                                  |
| Blog post                            | `BlogPosting` + `WebPage` + `BreadcrumbList`                                                                                                    |
| Every other page                     | `WebPage` + `BreadcrumbList` (same trail as the visible breadcrumbs)                                                                            |

## Sitemap and robots

- `@astrojs/sitemap` writes the index and skips redirect pages. `scripts/sitemap-integration.ts` then rewrites `sitemap-0.xml` from the emitted heads: one `<url>` per indexable page with the same hreflang alternates as its `<head>` (the integration cannot pair translated slugs such as `/es/servicios` and `/en/services`). Pages with `noindex` are not listed.
- `robots.txt` is the endpoint `src/pages/robots.txt.ts`: allows everything (assets included), blocks only `/property-sheet-source/`, and names `sitemap-index.xml` built from `site` + `base`.

## Retired URLs and redirects

`src/shared/i18n/retiredRoutes.ts` is the single source of every old URL (sell page, advisory service, custom search, living-in-Barcelona and province URLs, old root URLs of the previous WordPress site).

- Static host without rules: Astro emits a meta-refresh page per retired URL, `noindex`, `canonical` to the destination, with a visible link. They are not in the sitemap.
- Host rules: `docs/redirects.generated.txt` (`from to 301`, Cloudflare Pages / Netlify `_redirects` syntax, 365 lines, one splat per locale for the old province pages). Regenerate with `bun run redirects` (a test fails when the committed file is stale). `bun run redirects --base=/repo` writes the same rules under a sub-path.
- Wiring when the host is decided: copy the file to `public/_redirects` (Cloudflare Pages and Netlify read it from the published root) or translate each line to the host's own syntax (Vercel `redirects` in `vercel.json`, nginx `return 301`). The root rule `/ → /es` replaces the meta-refresh page at `/`. After that, the `redirects` entries of `astro.config.ts` can stay (harmless) or be dropped.
- Property detail rules of `AGENTS.md` §4.1 (outdated slug, unpublished property) still need per-request logic and are not covered here.

## Checks

- `bun run test`: builders, head parser and audit, sitemap, robots, redirect rules, zone meta.
- `bun run build && bun run check:seo`: audits every page of `dist` (title, description, `lang`, one `<h1>`, absolute canonical equal to its own hreflang, reciprocal hreflang across locales, JSON-LD parses, `og:image` absolute, redirect pages `noindex` + canonical, sitemap equals the set of indexable pages, robots names the sitemap and blocks no asset).
- `bun run test:e2e tests/e2e/seo.spec.ts` (the base is `ASTRO_BASE`, "/" by default): the same rules in a browser for one page of each template in the 4 locales.
