# AGENTS.md — HousySpace website

> Single source of truth for any AI agent working on this repository.
> Fields marked `TODO` must be confirmed before the related work starts. Never fill them with invented data.

## 1. Project overview

- **Client:** HousySpace Consultores Inmobiliarios, S.L. — CIF B26903419. Brand: **HousySpace · Property Solutions**.
- **Domain:** www.housyspace.com
- **Office:** Travessera de Gràcia 73, 2.º 3.ª · 08006 Barcelona (confirmed).
- **AICAT:** 14032 (must appear in footer and legal notice).
- **Goal:** Public website to showcase properties for sale and rent in Barcelona, capture leads into the CRM, and build a premium, trustworthy brand.
- **Primary users:** buyers, tenants (many international), owners who want to sell/rent.
- **Success metrics:** `TODO`

## 2. Tech stack

| Layer               | Choice                                                                        | Notes                                                                        |
| ------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Framework           | Astro + TypeScript (strict)                                                   | Static by default, on-demand rendering where needed                          |
| i18n                | Astro built-in i18n routing (`astro:i18n`)                                    | No third-party i18n routing library                                          |
| Styling             | Tailwind CSS                                                                  | Brand tokens from section 11                                                 |
| Content             | Astro Content Collections (custom Mobilia loaders + `glob()` for local pages) | See section 3.2                                                              |
| Content editing     | **Pages CMS** (hosted, free; `.pages.yml`) over the local JSON/Markdown files  | Client logs in by email invite (no GitHub account). Needs the repo on GitHub + the Pages CMS GitHub App. Listings stay in Mobilia |
| Navigation & motion | Astro View Transitions (`<ClientRouter />` from `astro:transitions`)          | See section 3.3                                                              |
| Interactive islands | Vanilla TypeScript (no UI framework)                                          | Gallery, map, drawer, filters, forms                                         |
| Data source         | Mobilia CRM Public API v1                                                     | See section 5                                                                |
| Reviews             | Typed by hand in Pages CMS                                                    | See section 6.1                                                              |
| Maps                | Leaflet + own clustering (`features/properties/ui/mapClusters.ts`), ICGC WMTS colour tiles ("estandard") | No Leaflet.markercluster (UMD needs a global `L`). Listings = approximate zone circles only (§5); attribution "© ICGC (CC BY 4.0)" |
| Charts              | Own typed SVG chart components (no chart library)                             | Line + bar charts for market data                                            |
| Hosting + adapter   | `TODO` (Vercel / Netlify / Node) — not decided                                | Keep code adapter-agnostic: no provider-specific APIs outside `astro.config` |
| Analytics           | `TODO`                                                                        | Only after cookie consent                                                    |
| Testing             | Vitest + Playwright + `@axe-core/playwright`                                  | Required by section 8                                                        |
| Formatting          | Prettier + `prettier-plugin-tailwindcss`                                      | Automatic Tailwind class ordering                                            |
| Package manager     | bun (`bun.lock`)                                                              | Run scripts with `bun run <script>`: `bun test` is Bun's own runner, not Vitest. Scripts run on Node (Astro, Playwright) |

Do not add dependencies outside this table without asking.

## 3. Architecture

Screaming + hexagonal architecture. Folders describe the business, not the framework.

```
src/
  pages/                  # Astro routes only (thin: compose features)
    [locale]/...
    api/                  # server endpoints (form handling, destination TODO)
  features/
    properties/
      domain/             # Property entity, value objects, pure rules
      application/        # use cases (searchProperties, getPropertyByRef)
      infrastructure/     # Mobilia adapter, Zod schemas, mappers
      ui/                 # .astro components + islands
    leads/                # contact, visit request, valuation (destination TODO)
    agency/               # about, team, services, sell your property
    valuation/            # external valuator iframe embed (no pricing logic)
    reviews/              # Google reviews (Places API adapter)
    blog/
    districts/            # living in Barcelona, district pages, map
  shared/
    ui/                   # atomic design: atoms, molecules, organisms
    i18n/                 # UI dictionaries: en, it, es, ca
    lib/
  styles/
```

Rules:

- `domain` imports nothing from `infrastructure`, `ui`, or Astro.
- Mobilia data enters ONLY through `features/properties/infrastructure`; it is validated with Zod and mapped to domain types. UI never sees Mobilia field names (`txtTituloWebEn`, `precioVenta`...).
- Ship zero JS by default; hydrate islands only where interaction is required (`client:visible` preferred).

### 3.1 Componentization & no duplication (mandatory)

- Everything visual is a component. Pages only compose components; no raw markup blocks repeated across pages.
- Before creating a component, search `shared/ui` and the feature's `ui/` for an existing one. Extend it via props/variants instead of copying it.
- Rule of two: the second time a piece of markup, logic, or style appears, extract it.
- Atomic design in `shared/ui`: atoms (Button, Input, Badge, Icon), molecules (FormField, PriceTag, PropertyFact), organisms (Header, Footer, LeadForm, PropertyCard, PropertyGallery).
- Variants via typed props (`variant`, `size`, `tone`), never by duplicating a component with a new name.
- Shared logic lives in one place: formatting (price, area, dates) in `shared/lib/format`, URLs only via `getLocalizedPath`, validation schemas shared between client and server.
- Styling: Tailwind classes using brand tokens only; no hardcoded hex values in components; repeated class groups become a component, not a copy-pasted string.
- One component per file, PascalCase, with typed `Props` interface.
- `shared/ui` never imports from `features/`. Feature-specific organisms live in the feature (e.g. `PropertyCard` in `features/properties/ui/`).

### 3.2 Astro Content Collections (mandatory for all content)

All content — remote and local — is accessed through Astro Content Collections. No ad-hoc `fetch` to Mobilia from pages or components.

- **`properties`** (build-time collection, `src/content.config.ts`): custom loader `mobiliaPropertiesLoader()` in `features/properties/infrastructure/`.
  - The loader is the Mobilia adapter: gets the OAuth token, pages through `GET /api/v1/inmuebles`, filters `publicarEnWeb && activo`, and calls `store.set()` with the entry id = `referencia`.
  - Incremental sync: persist the last sync date in the loader `meta` store and use `FechaUltimaModificacion`; remove entries returned by `/inmuebles/desactivados`.
  - Zod `schema` validates and maps Mobilia fields to the domain `Property` (locales flattened to `{ es, en, it, ca }`). Pages only see the mapped shape.
- **`agents`** (build-time): custom loader over `GET /api/v1/agentes` for team pages and listing contacts.
- **`pages`** (build-time, `glob()` loader): Markdown/MDX in `src/content/pages/{locale}/` for Services, Living in Barcelona, About us, and legal pages. Frontmatter schema includes `routeKey`, `title`, `description`, `locale`.
- **`pages`** (build-time, `glob()` over `src/content/pages/{key}.{locale}.json`): every editorial page as a head plus sections of flat items (`features/pages/infrastructure/pageSchema.ts`). A missing locale falls back to Spanish with `lang="es"` and `noindex`.
- **`market`** (build-time, `src/content/market/barcelona.json`): official figures of the 10 districts and 73 barrios.
- **`home`** (build-time, `glob()` over `src/content/home/{locale}.json`): editorial copy and media of the home page (UI proposal v3), edited in Pages CMS. Schema: `features/agency/infrastructure/homeContentSchema.ts` (strict); read via `getHomeContent(locale)`.
- **`blog`** (build-time, `glob()` over `src/content/blog/*.md`, one file per article, created in Pages CMS). Schema: `features/blog/infrastructure/blogSchema.ts`. The file name is the URL slug. An article is served under every locale; only its own `language` is indexed.
- **CMS-editable content (Pages CMS):** one file per locale; every CMS content file lives at `src/content/<collection>/<file>` (two folders below `src/`), because images are written as `../../assets/...` relative to the file so Astro's `image()` optimizes them; videos go to `public/media`. Headings mark their light-weight part with `*asterisks*` (`shared/lib/emphasis.ts`), never HTML. Fixed parts of a layout are named fields (`step1`…`step3`), not lists. Every form field in `.pages.yml` must match the schema (tested). UI labels (buttons, aria, legal) stay in the i18n dictionaries.
- Query only with `getCollection()` / `getEntry()` wrapped in application use cases (`features/*/application`), never directly inside UI components.
- **Freshness:** build-time collections refresh on every build, triggered by a scheduled rebuild/deploy hook (`TODO` frequency, depends on hosting). If near real-time data becomes a requirement, switch `properties` to a live collection (`defineLiveCollection` in `src/live.config.ts`, requires on-demand rendering). The loader stays the only place that changes.
- Loaders and schemas are covered by Vitest tests using recorded Mobilia fixtures (secrets and personal data stripped).

### 3.3 View Transitions (dynamic UI)

The site must feel like an app: smooth, continuous navigation using Astro View Transitions.

- `<ClientRouter />` is added ONCE, in the shared `<head>` of the base layout. Never per page.
- **Shared-element morphs** (signature effect):
  - `PropertyCard` image → property detail hero: `transition:name={`property-${ref}-image`}` on both.
  - Card title and price → detail title and price with matching names (`property-${ref}-title`, `property-${ref}-price`).
  - Names must be unique per page; build them with ONE helper (`shared/lib/transitionNames.ts`), never inline strings.
- **Persistent elements:** islands that must keep state use `transition:persist`. The header is NOT persisted (its locale links change per page): it uses `transition:name="site-header"` + `transition:animate="none"` so it stays still while content transitions.
- Animation presets live once in `shared/ui/motion/transitions.ts` (e.g. `morph`, 350ms, brand easing).
- **Animations:** use `fade`/`slide` from `astro:transitions` or custom animations defined once in `shared/ui/motion/`. Brand feel: elegant and calm, 250–400ms, ease-out; no bouncy or flashy effects.
- **Scripts:** any client script that binds DOM events runs inside `document.addEventListener("astro:page-load", ...)`, since inline scripts do not re-run after client-side navigation. Analytics page views fire on `astro:page-load` (only after consent).
- **Forms:** `LeadForm` submission is handled by its island (fetch to the API endpoint); it must not trigger a full router navigation.
- **Locale switcher:** navigates via `getLocalizedPath`; verify `<html lang>` and `hreflang` update after the swap.
- **Accessibility:** ClientRouter already disables animations under `prefers-reduced-motion`; never override that. Focus and screen-reader announcements must work after each navigation (covered by Playwright tests).
- **Performance:** transitions never delay content; no layout shift; keep prefetch on for listing → detail links.

## 4. Internationalization

- Locales: `en`, `it`, `es`, `ca`. Default locale: `es` (Spain, `es-ES` for `lang`/`hreflang`; also `en`, `it-IT`, `ca-ES`).
- Use Astro i18n config (`i18n.locales`, `i18n.defaultLocale`, `routing.prefixDefaultLocale: true`) and helpers from `astro:i18n` (`getRelativeLocaleUrl`, etc.).
- Every page emits `hreflang` alternates + `x-default`.
- UI strings live in `shared/i18n/{locale}.ts`; no hardcoded user-facing text. Missing keys fail the type check.
- Property titles/descriptions come from Mobilia per locale (`txtTituloWeb{Ca|En|It}`, base field = es). Fallback order: requested locale → `es` → `en`.
- Localized slugs: yes (see section 4.1).

### 4.1 URL structure (SEO)

- Every locale prefixed, including the default: `/es/`, `/en/`, `/it/`, `/ca/` (`routing.prefixDefaultLocale: true`).
- `/` → 301 to `/es/`. No automatic redirect by browser language or IP (Googlebot must reach every version). Optional non-blocking language suggestion banner.
- Translated path segments per locale (Astro i18n does not translate segments): one route map in `shared/i18n/routes.ts` + a helper `getLocalizedPath(routeKey, locale, params)`. Never build URLs by string concatenation in components.
- Lowercase, hyphen-separated, ASCII only (strip accents: `gràcia` → `gracia`). `trailingSlash: "never"`, enforced.
- Each page: self-referencing `canonical`, `hreflang` for the 4 locales + `x-default` → `/es/...`.
- Real HTTP 301s require an adapter or host-level redirect rules; a static build without them emits meta-refresh redirects, which are NOT acceptable for SEO. Implement redirects only once hosting is decided.

| Route key           | es                       | en                        | it                         | ca                       |
| ------------------- | ------------------------ | ------------------------- | -------------------------- | ------------------------ |
| home                | `/es`                    | `/en`                     | `/it`                      | `/ca`                    |
| sale listing        | `/es/venta`              | `/en/sale`                | `/it/vendita`              | `/ca/venda`              |
| rent listing        | `/es/alquiler`           | `/en/rent`                | `/it/affitto`              | `/ca/lloguer`            |
| property detail     | `/es/venta/{slug}-{ref}` | `/en/sale/{slug}-{ref}`   | `/it/vendita/{slug}-{ref}` | `/ca/venda/{slug}-{ref}` |
| services            | `/es/servicios`          | `/en/services`            | `/it/servizi`              | `/ca/serveis`            |
| living in Barcelona | `/es/vivir-en-barcelona` | `/en/living-in-barcelona` | `/it/vivere-a-barcellona`  | `/ca/viure-a-barcelona`  |
| about               | `/es/nosotros`           | `/en/about-us`            | `/it/chi-siamo`            | `/ca/qui-som`            |
| contact             | `/es/contacto`           | `/en/contact`             | `/it/contatti`             | `/ca/contacte`           |
| legal notice        | `/es/aviso-legal`        | `/en/legal-notice`        | `/it/note-legali`          | `/ca/avis-legal`         |
| privacy             | `/es/privacidad`         | `/en/privacy-policy`      | `/it/privacy`              | `/ca/privacitat`         |
| cookies             | `/es/cookies`            | `/en/cookie-policy`       | `/it/cookie`               | `/ca/galetes`            |
| sell                | `/es/vender`             | `/en/sell`                | `/it/vendere`              | `/ca/vendre`             |
| valuation           | `/es/valoracion`         | `/en/valuation`           | `/it/valutazione`          | `/ca/valoracio`          |
| blog                | `/es/blog`               | `/en/blog`                | `/it/blog`                 | `/ca/blog`               |
| blog post           | `/es/blog/{slug}`        | `/en/blog/{slug}`         | `/it/blog/{slug}`          | `/ca/blog/{slug}`        |
| district            | `/es/vivir-en-barcelona/{district}` | `/en/living-in-barcelona/{district}` | `/it/vivere-a-barcellona/{district}` | `/ca/viure-a-barcelona/{district}` |
| barrio              | `/es/vivir-en-barcelona/{district}/{barrio}` | `/en/living-in-barcelona/{district}/{barrio}` | `/it/vivere-a-barcellona/{district}/{barrio}` | `/ca/viure-a-barcelona/{district}/{barrio}` |
| municipalities      | `/es/provincia-de-barcelona` | `/en/barcelona-province` | `/it/provincia-di-barcellona` | `/ca/provincia-de-barcelona` |
| municipality        | `/es/provincia-de-barcelona/{municipio}` | `/en/barcelona-province/{municipio}` | `/it/provincia-di-barcellona/{municipio}` | `/ca/provincia-de-barcelona/{municipio}` |
| service detail      | `/es/servicios/{service}` | `/en/services/{service}` | `/it/servizi/{service}` | `/ca/serveis/{service}` |
| custom search       | `/es/busqueda-a-medida`  | `/en/property-search-service` | `/it/ricerca-su-misura` | `/ca/cerca-a-mida`  |
| international guide | `/es/guia-internacional` | `/en/international-guide` | `/it/guida-internazionale` | `/ca/guia-internacional` |
| home search         | `/es/busco-vivienda`     | `/en/find-a-home`         | `/it/cerco-casa`           | `/ca/busco-habitatge`    |
| data sources        | `/es/datos`              | `/en/data`                | `/it/dati`                 | `/ca/dades`              |

`{service}`, `{district}`, `{barrio}`, `{municipio}` slugs are localized where a translation exists (official Catalan place names stay as-is, ASCII-slugified).

Property detail rules:

- `{slug}` = localized title from Mobilia (`tituloWeb` in that locale), slugified, max ~60 chars. `{ref}` = Mobilia `referencia` (lowercased) and is the ONLY lookup key.
- Request with a valid ref but outdated slug → 301 to the current slug. A property listed for both sale and rent gets one canonical URL per operation.
- Property no longer published (`/inmuebles/desactivados`) → 301 to its operation listing. Unknown ref → 404.
- Listing filters live in query params, the same names in every locale: `zona tipo pmin pmax smin smax hab ban car mapa orden vista` (`features/properties/application/catalogQuery.ts`, parsed with Zod). Canonical points to the unfiltered listing; `noindex,follow` on filtered and paginated-beyond-page-1 states is `TODO` (static build: needs on-demand rendering or a client-side meta).
- Zone landing pages (`/es/venta/eixample`) are a later SEO phase, not MVP.

## 5. Mobilia CRM integration

- Spec: `https://api.mobiliagestion.es/swagger/v1.0/swagger.json` (Mobilia Public API v1.0).
- **Auth:** OAuth2 `client_credentials` → `POST /api/v1/token` returns `access_token` + `expires_in`. Not refreshable: cache it server-side and request a new one on expiry.
- `CLIENT_ID` / `CLIENT_SECRET` (in `.env`) live ONLY in server env vars, read via `astro:env` with `context: "server", access: "secret"`. Never call Mobilia from the browser. `.env` is gitignored; `.env.example` lists the names without values. Agents must never print or log these values.
- **Read endpoints used:**
  - `GET /api/v1/inmuebles` — published properties (paged: `NumeroPagina`, `TamanoPagina`; filters `TiposOperacion`, `PrecioVentaDesde`, `FechaUltimaModificacion`...).
  - `GET /api/v1/inmuebles/desactivados` — to unpublish sold/withdrawn listings.
  - `GET /api/v1/agentes` — team pages and agent per listing.
  - `GET /api/v1/textoslegales` — `TODO` check if legal texts should come from here.
- **Read-only integration.** Mobilia is the single source of truth for properties: no local database, no admin panel, no property CMS, no copies of listings edited here. The website never creates, updates, or deletes anything in Mobilia unless this file is changed to allow it.
- Lead forms destination: `TODO` (Mobilia write endpoints `POST /clientes`, `/solicitudes`, `/visitas` exist but are NOT enabled).
- **Photos:** served from `https://media.mobiliagestion.es/Portals/...`. Allow this host in Astro `image.remotePatterns`; strip tracking params (`utm_*`) in the mapper; always render through Astro `<Image />`/`<Picture />`.
- **Privacy:** never render `direccionPrivada`, owners, keys, or documents.
- **Location is ALWAYS approximate, on every map and in all markup (JSON-LD included):** only `latitudZona`/`longitudZona`/`radioZona`, drawn as a circle of at least 500 m radius (`MIN_AREA_RADIUS_M`), max zoom 16. Mobilia's zone coordinates are often the building itself, so the mapper snaps them to a ≈ 550 m grid cell centre (`toApproximateCentre`, max offset 400 m < circle radius) before anything is stored; never centre a map on raw Mobilia coordinates. `latitud`, `longitud` and `direccionPublica` are never parsed, even when `mostrarDireccionExacta` is true; the domain `PropertyLocation` has no exact variant. No zone coordinates → no map. Structured data carries the locality only (no street, no `geo`).
- Only show properties with `publicarEnWeb = true` and `activo = true`. Show "reserved" badge when `reservado = true`. Respect `precio*AConsultar` (show "price on request").
- **Freshness strategy:** build-time collection + incremental sync (`FechaUltimaModificacion`, 5-min overlap) + scheduled hourly rebuild (cron → deploy hook, hosting `TODO`). Details in `docs/content-sync.md`. The content data store must be cached between CI builds. Rate limits: none advertised in headers — `TODO` ask Mobilia.
- **Confirmed API facts:** base URL `https://api.mobiliagestion.es`; token TTL 7200s; page size max 100; null fields are omitted (not `null`); descriptions are HTML (stored as plain text); `tituloWeb` may be empty → fall back to the first clause of the auto-generated summary.
- Fixtures: `tests/fixtures/mobilia/` (sanitized).

## 6. Pages / features (MVP)

Main navigation (from brand manual): **Properties · Services · Living in Barcelona · About us · Contact**.

1. Home — hero (video/photo with negative logo), search, featured properties (`portadaWeb`), CTA valuation
2. Properties — filters (operation, type, price, rooms, area, zone), list + map, shareable URL params
3. Property detail — gallery, key facts, energy rating, virtual tour (`urlVisitaVirtual`), map, contact/visit form, similar properties
4. Services — content provided by the client later; use clearly marked placeholders
5. Living in Barcelona — content provided by the client later; use clearly marked placeholders
6. About us / team
7. Contact
8. Legal: legal notice, privacy policy, cookie policy
9. Lead form — ONE reusable `LeadForm` organism, used in contact page and property detail (and as CTA where needed), configured by props:
   - Fields: name, email, phone, message, required unticked privacy consent; property reference auto-filled (hidden) on property detail.
   - Client + server validation with the same Zod schema; honeypot + rate limiting; success/error states translated in the 4 locales.
   - Submitted to a server endpoint in `src/pages/api/`. Delivery destination: `TODO` (Mobilia stays read-only).
10. Property PDF sheet — in scope, see item 24.
11. Sell your property — owner-focused page with CTA to valuation and `LeadForm`.
12. Valuation tool — provided by an external valuator embedded via iframe; it computes and returns prices itself. This site NEVER calculates, stores, or alters valuation figures.
    - One `ValuationEmbed` component (`features/valuation/ui/`), configured by props; used on the valuation page and anywhere else it appears.
    - Valuator URL/provider: `TODO`. Store the URL and allowed origin in config (`astro:env`, public), never hardcoded in components.
    - iframe: descriptive localized `title`, `loading="lazy"`, `sandbox` with only the permissions the valuator requires, `referrerpolicy="strict-origin-when-cross-origin"`, pass `?lang=` if the valuator supports it (`TODO`).
    - Add the valuator origin to the CSP `frame-src`.
    - If the valuator sends `postMessage` events (e.g. resize, completed): accept only from the configured origin and parse with a Zod schema into a typed discriminated union; ignore everything else.
    - If the valuator sets cookies or tracking, load it only after consent, with a placeholder + consent CTA until then (`TODO` confirm with the provider).
    - Surrounding content (3-step explainer, CTA to advisor) comes from the UI proposal.
13. Blog — `blog` content collection (`glob()`, Markdown/MDX per locale); index + article pages; empty state until articles exist.
14. Living in Barcelona — 10 district pages from a `districts` content collection (per locale) + interactive district map (map provider `TODO`, attribution required).
15. Google reviews — see section 6.1.
16. Contact CTAs — tap-to-call, WhatsApp with prefilled localized message, private consultation (`LeadForm`). Company phone/WhatsApp number: `TODO` confirm.

17. Services — index + 9 service pages (rental & management, advisory, interior design, real estate investment, personal shopper, renovations, valuation, strategic sale; `reformas-interiorismo` in the prototype looks like a leftover — `TODO` confirm).
18. Property catalog — filters synced with URL (operation, type, district/barrio, price and area ranges, bedrooms, bathrooms, features, sort, list/map view) with a synced clustered map.
19. Living in Barcelona — choropleth map (sale price / rent / density), barrio search, sortable 73-barrio comparison table, 10 district pages + 73 barrio pages with market charts (sale €/m² 2012→, rent 2014→, barrio vs district vs city), population, density, income.
20. Barcelona province — ~155 municipality pages with official data table (population, area, density, comarca, territorial code) + market data where available.
21. Custom search ("búsqueda a medida") — `LeadForm` variant.
22. International guide — NIE, taxes, financing; content pending review by the partner tax advisor/law firm (`TODO`).
23. Data sources page — every dataset, provider, license, last update, and link (section 6.2).
24. Property PDF sheet — A4 sheet per property, operation and locale from Mobilia data. Source = internal HTML page (`src/pages/property-sheet-source/`, `features/properties/ui/sheet/`), printed to `/pdf/*.pdf` after `astro build` by `scripts/build-property-sheets.ts` (Playwright Chromium); the HTML sources are deleted from `dist`. The detail page offers it as a direct download (`<a download>`). Same privacy rules as the site: the map is the approximate zone circle on ICGC colour tiles.
25. 404 page in the 4 locales.

All sections and pages of the UI proposal (section 11.1) are in scope.

### 6.2 Market & territorial data

- Sources:
  - **Sale prices (€/m²)**: Portal de Dades, Ajuntament de Barcelona (Consejo General del Notariado data).
  - **Rents**: Portal de Dades / **INCASÒL** rental deposits (fianzas).
  - **Population, density**: Padró — Open Data BCN (CKAN API).
  - **Boundaries**: CartoBCN (districts, barrios, CC BY 4.0); ICGC (municipalities, CC BY 4.0).
  - **Province**: INE (Padrón), Idescat (area, density, comarca); Agència de l'Habitatge de Catalunya / Ministerio de Vivienda for market data where available.
- Exact dataset IDs, endpoints, and update frequency: `TODO` (confirm per source). License/reuse terms for Portal de Dades, Open Data BCN, Notariado, and INCASÒL: `TODO` verify before publishing.
- Access ONLY through content collections (`marketStats`, `geo`) with loaders in `features/districts/infrastructure/`. Never hardcode figures in pages or components.
- Every metric is typed: `{ value, unit, year, provisional?: { value, until }, source, sourceUrl }`. Every figure displayed shows its source and year; provisional values are labeled.
- Attributions (CC BY) are rendered wherever data or boundaries are shown, and listed on the data sources page.
- If a metric is unavailable, show "not available" — never estimate or interpolate.

### 6.1 Client reviews

- Decision (client, 2026-10-30): reviews are typed by hand in Pages CMS (`testimonials` collection, one JSON file each in `src/content/testimonials`), so nothing is fetched from or stored through a Google API. Google's Places policy forbids storing its API content, which ruled out a cached API integration.
- The home shows the latest 3 (`LATEST_TESTIMONIALS`) with a notice of that criterion and a link to the Google profile (`home.reviews.mapsUrl`), where all of them can be read.
- Copy each text word for word, never improve it. Newest first, never picked to hide negative ones.
- Author as first name and surname initial, no photos: personal data minimised, pending lawyer review (I24).
- No reviews → the section hides. Never fake reviews.

## 7. Legal & compliance (Spain / Catalonia) — verify with the client's lawyer

- RGPD + LOPDGDD: explicit, unticked consent on every form; link to privacy policy; store consent in the CRM lead.
- LSSI: legal notice with company data (name, CIF, address, registry details `TODO`).
- Cookies: consent banner; no non-essential cookies before consent.
- Catalonia: display the AICAT registration number **14032** (footer + legal notice).
- Energy rating (`calificacionEnergetica`) shown on every listing.
- Rentals in Barcelona (stressed area): current housing-law disclosure requirements — `TODO` lawyer.

## 8. Quality standards

- **TDD:** failing test first. Vitest for domain/application/adapters (Mobilia mocked with fixtures from real responses), Playwright for search, detail, and lead submission in all 4 locales.
- **Types:** end-to-end typing is mandatory — see section 8.1.
- **Accessibility:** WCAG 2.2 AA; turquoise `#21CEC5` on white fails contrast. On light backgrounds: `turquoise-deep` `#058C93` (4.05:1) only for large text (≥24px, or ≥18.66px bold) and non-text UI (icons, borders, focus rings, 3:1); for normal-size text and links use `petrol` `#0F5A5E` (7.9:1) or `teal` `#08777B` (5.3:1).
- **Performance:** Lighthouse ≥ 90 mobile; LCP < 2.5s. Photos use `<Picture>` with the shared `PHOTO_PICTURE` config (AVIF + WebP); exactly one eager/priority image per page; first-load JS ≈ 6–8 KB; heavy assets (Leaflet, hero video) load on visibility/idle. Budgets enforced in `tests/e2e/performance.spec.ts`; details and how to re-measure in `docs/performance.md`.
- **SEO:** per-page metadata, Open Graph, sitemap (`@astrojs/sitemap` with i18n), `robots.txt`, JSON-LD (`RealEstateAgent`, `Residence` + `Offer`), clean slugs including the property reference.
- **Security:** server-side validation, rate limiting + honeypot/captcha on forms, secrets only in env vars, never expose CRM errors to users.

### 8.1 End-to-end typing (mandatory)

Every value is typed from the moment it enters the system until it reaches the HTML. A type error is a build failure.

- **Compiler:** extend `astro/tsconfigs/strictest`. No `any`, no `@ts-ignore`, no non-null `!` assertions, no `as` casts except `as const` and narrowly justified cases with a comment. Use `unknown` + parsing instead.
- **External data (Mobilia, Google, valuator `postMessage`, form input, URL params):** parsed with Zod at the boundary; TS types are inferred with `z.infer` — never written by hand in parallel.
- **Domain:** explicit types for entities and value objects; branded types for identifiers and units (`PropertyRef`, `Locale`, `PriceEUR`, `AreaM2`); string literal unions / discriminated unions for states (`operation`, `status`). No raw `string` or `number` for domain concepts.
- **Content collections:** every collection has a Zod schema; use `CollectionEntry<"...">` types, never re-declare them.
- **Env:** only through `astro:env` schema (`envField`), never `import.meta.env` or `process.env` directly.
- **i18n:** `Locale` union derived from the config; dictionary keys typed so a missing or misspelled key fails the type check; every locale dictionary must satisfy the same type.
- **Routes:** `RouteKey` union from `shared/i18n/routes.ts`; `getLocalizedPath` params typed per route key. No string URLs in components.
- **Components:** every `.astro` component and island declares `interface Props`; variants are literal unions.
- **API endpoints:** request and response schemas shared between the endpoint and the client island (one Zod schema, inferred types); responses are typed discriminated unions (`{ ok: true, ... } | { ok: false, error: ... }`).
- **Errors:** typed result types in application use cases; no thrown strings.
- **CI gate:** `astro check` + `tsc --noEmit` with zero errors and zero warnings.

## 9. Conventions

- Code, identifiers, comments, commits: English.
- UI copy: i18n dictionaries only.
- Conventional commits; no AI attribution.
- Prettier + ESLint + `astro check` must pass before commit.

## 10. Commands

```bash
bun install
bun run dev
bun run test         # Vitest (never `bun test`: that is Bun's own test runner)
bun run test:e2e     # Playwright (first time: bunx playwright install chromium)
bun run lint
bun run check        # astro check (types)
bun run build        # astro build + property sheet PDFs (needs Chromium)
```

## 11. Brand & design (source: HousySpace brand manual 2026)

**Colors**

| Token            | HEX                               | Use                                                               |
| ---------------- | --------------------------------- | ----------------------------------------------------------------- |
| `petrol-dark`    | `#14282B`                         | Headings, brand backgrounds                                       |
| `petrol`         | `#0F5A5E`                         | Primary brand color                                               |
| `green-grey`     | `#58706F`                         | Secondary text                                                    |
| `grey`           | `#918F8F`                         | Muted text                                                        |
| `turquoise`      | `#21CEC5`                         | Digital accents on dark backgrounds (links, buttons, map markers) |
| `turquoise-deep` | `#058C93`                         | Large text / UI accents on light backgrounds (not small text, §8) |
| `bg-dark-1/2/3`  | `#1A2A2D` / `#22363A` / `#2A4044` | Dark sections                                                     |

No other color combinations for the logo.

**Typography**

- Montserrat — the ONLY text font (client decision 2026-10-30, overrides the brand manual), one variable file with weights 400–900. All site text is uppercase, tracking 0.02em, never italic. h1/h2 800 (900 when they contain an `em`), h3 700, the `em` part of a heading 400. The property PDF sheet stays in sentence case.
- Objektiv Mk1 — logo only, never in text (use the SVG logo, never re-typeset it).

**Logo**

- Header: official logo on white. Over video/photos: negative version.
- Clear space = height of the "o" in "Housy". Minimum size: full logo 140px, basic 100px, isotype 24px.
- Isotype: favicon, map marker, social avatars. Never stretch, recolor, or rotate.
- Source: `logo/housyspace-completo-oficial.svg` (official version). Groups by color: `#housy` (#14282B), `#tejado` (#0F5A5E), `#space` (#58706F), `#lema` (#918F8F). The other manual versions (negative, monochrome petrol/black/white) are derived ONLY by recoloring these groups with manual colors.
- Isotype SVG: the UI proposal contains `isotipo.svg` and `logo-blanco.svg` — `TODO` confirm they are official before use. Until then use a neutral placeholder; do NOT crop or redraw the isotype from the full logo.
- Media: the proposal's hero video and architecture images are AI-generated placeholders — replace with licensed footage/photos (author + license recorded) before launch.
- Copy to `public/brand/` at scaffold time; PNGs are for social/OG only.

**Graphic resources**

- Parallel lines at the roof angle (38.6°), petrol or grey, low presence.
- Photography: real Barcelona architecture/streets, B&W or petrol-tinted, natural light.

**Tone:** "Soluciones inmobiliarias a tu medida" — elegant, close, international.

### 11.1 UI proposal (visual reference)

- Source (current, **v3**): https://claude.ai/artifact/9boSsZEnH16FUL5ATJ78Pk — the site is being restyled to it in phases (ROADMAP). Its demo listings, photos and placeholder copy are never real content.
- Previous reference (v1, superseded as each phase lands): https://claude.ai/artifact/U6AnjESPcJssjpZy9dDoz8.
- Rebuild it with this project's components and tokens; do not copy its CSS/JS files.
- **Look (v3):** light editorial design on warm paper (`#FCFBF8`) with dark `#162B2A` blocks (header bar, valuation, reviews, footer, text over photos), Montserrat only (all caps), large imagery.
- **Extra UI tokens** (from the prototype, complementing section 11 — define once in `@theme`):

| Token | HEX | Use |
|-------|-----|-----|
| `canvas` | `#FCFBF8` | Page background (role) |
| `bg-deep` / `bg-soft` | `#EDEAE3` / `#F3F1EB` | Placeholders, alternate fills (role) |
| `card` / `card-hover` | `#F3F1EB` / `#ECE8DF` | Cards (role) |
| `line` | `rgb(23 43 43 / .12)` | Borders/dividers (role) |
| `fg` / `muted` | `#172B2B` / `#5F6967` | Main / secondary text (role) |
| `accent` | `#08777B` | Accent text and links (role) |
| `ink` | `#0B1214` | Fixed dark ink (overlays, text on turquoise) |
| `teal` | `#08777B` | Intermediate accent |
| `stone` | `#EBE5DC` | Light warm sections |
| `taupe` | `#A99F92` | Warm muted detail |

Role tokens are redefined by `.surface-dark` (canvas `#162B2A`, fg `#F7F5F1`, muted `#B4BFBE`, accent `#21CEC5`) and `.surface-stone` (canvas `#EBE5DC`, darker muted and accent for AA). Components use the roles and never branch on the theme.

- **Motion:** shared easing `cubic-bezier(.2,.7,.2,1)`; scroll-reveal (fade/translate) on section content and line-by-line reveal on the hero heading, via ONE IntersectionObserver utility initialized on `astro:page-load`; slow image zoom on hover (≈1.2–1.6s); UI micro-transitions 250–350ms. All disabled under `prefers-reduced-motion`.
- **Header (v3):** petrol bar with the negative logo (transparent over the home hero until scroll), main menu with dropdowns, language switcher, skip-to-content link. The menu stays **inline whenever it fits** (measured in three densities, `shared/ui/organisms/navFit.ts`, never by a fixed breakpoint, never clipped); only when it does not fit does it move behind the "Menu" button (light drawer from the right), shown together with the "Let's talk" CTA.
- **Home sections:** 01 Hero (video + poster) · 02 Services (6 cards) · 03 Featured properties (Mobilia `portadaWeb`) · 04 Valuation explainer · 05 Google reviews · 06 Living in Barcelona (10 districts) · 07 Blog · Contact block · Footer (company data + AICAT).
- **Scope:** EVERYTHING in the proposal is in scope (confirmed). See section 6 for the full feature list.

## 12. Agent skills (local)

- Project skills live in `.claude/skills/<skill-name>/SKILL.md` and are committed to the repo. Index: `.claude/skills/README.md`.
- Before starting any task, check the skills index and load every skill whose description matches the task. Skills complement this file; if they conflict, this file wins and the skill must be fixed.

| Skill | Use when |
|-------|----------|
| `mobilia-loader` | Building or changing Mobilia content loaders, schemas, fixtures |
| `new-component` | Creating or extending any UI component |
| `localized-page` | Adding a page or route in the 4 locales |
| `view-transitions` | Navigation, animations, persisted elements |
| `tailwind-css` | Styling, design tokens, responsive layout |
| `astro-best-practices` | Rendering mode, islands, images, env, endpoints, performance |
| `seo-multilingual` | Metadata, canonical, hreflang, JSON-LD, sitemap, redirects |
| `testing-tdd` | Writing tests (Vitest, Playwright) — always, with any code change |
| `commit-per-task` | Finishing any task: one conventional commit per tested task, explaining what and why |

- Third-party skills: read the full content first (never import unreviewed scripts), then copy the folder into `.claude/skills/` or install via `/plugin marketplace add <owner/repo>` + `/plugin install <plugin>@<marketplace>` with project scope. Record the source in the skills index.
- Claude Code entry point: `CLAUDE.md` contains `@AGENTS.md` so this file stays the single source of truth.

## 13. Agent rules

- Read this file before any task. If a request conflicts with it, ask.
- `ROADMAP.md` tracks phases, status, and client inputs. Check it before starting work; update its checkboxes and decisions log when a task lands. Never start work marked 🔒 until its input is resolved.
- Never invent listings, prices, legal text, company data, or translations of legal text.
- Do not change the stack or architecture, or add dependencies, without approval.
- Small, reviewable changes; tests and code ship together.
- Never duplicate code: reuse or extend existing components and helpers (section 3.1). Duplicated markup or logic is a defect.
- When requirements are ambiguous, ask one question and stop.
