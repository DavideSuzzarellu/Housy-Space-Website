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
| Styling             | Tailwind CSS                                                                  | Brand tokens from section 11 (`docs/design-system/tokens.json`)              |
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
    agency/               # about, team, services
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
- Ship zero JS by default; hydrate islands only where interaction is required (`client:visible` preferred). Interactions and animations the reference has are required interactions (UI parity rule, §11): reproduce them with the smallest lazy script, CSS first where it gives the identical result.

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
- **`pages`** (build-time, `glob()` over `src/content/pages/{key}.{locale}.json`): every editorial page as a head plus sections of flat items (`features/pages/infrastructure/pageSchema.ts`). Every page ships in the 4 locales (§4). The Spanish fallback (`lang="es"` + `noindex`) is only a safety net for a file not translated yet, never the intended state.
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
- **All site copy is translated into the 4 locales** (decision 2026-11-04): UI dictionaries, `home`, `pages`, district and barrio prose. The Spanish text of the UI proposal (§11.1) is the source; en/it/ca are translations pending client review (ROADMAP). Not translated: Mobilia data (comes per locale), client reviews (verbatim, §6.1) and blog articles (one language each). Legal texts are translated too (client decision 2026-11-04, exception to §13), marked as pending lawyer review (I11); they will be replaced by the validated versions.
- **Translation style (client decision 2026-11-24):** the Spanish text is the source (verbatim from the reference, which exists only in Spanish) and en/it/ca are written by us as faithful but NOT literal translations: same meaning, facts, figures, tone and fixed phrases, but natural and idiomatic in each language, as a native copywriter would write it, never word-for-word calques (no Spanish syntax or false friends). Same register as §11.5 (warm, direct, informal "you"). Sentence length and headings may be reshaped when the target language needs it, keeping the `*asterisk*` emphasis on the equivalent part. Legal, tax and financial text stays faithful and precise (natural wording, no changed meaning, no added or dropped clauses) and keeps the pending-lawyer-review notice.
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
| living in Barcelona | `/es/zonas/barcelona` | `/en/zones/barcelona` | `/it/zone/barcelona` | `/ca/zones/barcelona` |
| about               | `/es/nosotros`           | `/en/about-us`            | `/it/chi-siamo`            | `/ca/qui-som`            |
| contact             | `/es/contacto`           | `/en/contact`             | `/it/contatti`             | `/ca/contacte`           |
| legal notice        | `/es/aviso-legal`        | `/en/legal-notice`        | `/it/note-legali`          | `/ca/avis-legal`         |
| privacy             | `/es/privacidad`         | `/en/privacy-policy`      | `/it/privacy`              | `/ca/privacitat`         |
| cookies             | `/es/cookies`            | `/en/cookie-policy`       | `/it/cookie`               | `/ca/galetes`            |
| valuation           | `/es/valoracion`         | `/en/valuation`           | `/it/valutazione`          | `/ca/valoracio`          |
| blog                | `/es/blog`               | `/en/blog`                | `/it/blog`                 | `/ca/blog`               |
| blog post           | `/es/blog/{slug}`        | `/en/blog/{slug}`         | `/it/blog/{slug}`          | `/ca/blog/{slug}`        |
| district            | `/es/zonas/barcelona/distritos/{district}` | `/en/zones/barcelona/districts/{district}` | `/it/zone/barcelona/distretti/{district}` | `/ca/zones/barcelona/districtes/{district}` |
| barrio              | `/es/zonas/barcelona/{barrio}` | `/en/zones/barcelona/{barrio}` | `/it/zone/barcelona/{barrio}` | `/ca/zones/barcelona/{barrio}` |
| service detail      | `/es/servicios/{service}` | `/en/services/{service}` | `/it/servizi/{service}` | `/ca/serveis/{service}` |
| my search           | `/es/mi-busqueda`        | `/en/my-search`           | `/it/la-mia-ricerca`       | `/ca/la-meva-cerca`      |
| international guide | `/es/guia-internacional` | `/en/international-guide` | `/it/guida-internazionale` | `/ca/guia-internacional` |
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

Main navigation (UI proposal v3, 2026-11-02, supersedes the brand manual): **Properties · Services · Living in Barcelona · My search · About us · Blog · Where we are · Contact**. Submenus: Properties (all, for sale, for rent, on the map); Services (the services index page + the 9 services); Living in Barcelona (map and neighbourhood search + the 10 districts). "Where we are" links to the about page `#donde-estamos`. The services index is a real page, as in the reference site (decision 2026-11-24). The sell page and the advisory service were retired by the client (reference `_redirects`): `/vender` and the old advisory URL 301 to the sale brokerage service and to the services index (`shared/i18n/retiredRoutes.ts`, wired in `astro.config.ts`). "My search" merges home search and custom search into one page with its own route `mySearch` (§4.1, decision 2026-11-04); `homeSearch` and `customSearch` are retired (their 301s to `mySearch` wait for hosting, I2).

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
11. (retired) Sell your property page: replaced by the sale brokerage service.
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

17. Services — index page (design canvas layout, cards built from each service page) + 8 service pages: sale brokerage, valuation, legal & tax advice, renovations & interior design, financial advice, personal shopper, real estate investment, rental & management.
18. Property catalog — filters synced with URL (operation, type, district/barrio, price and area ranges, bedrooms, bathrooms, features, sort, list/map view) with a synced clustered map.
19. Living in Barcelona — choropleth map (sale price / rent / density), barrio search, sortable 73-barrio comparison table, 10 district pages + 73 barrio pages with market charts (sale €/m² 2012→, rent 2014→, barrio vs district vs city), population, density, income.
20. ~~Barcelona province~~ — removed (client decision 2026-11-24): no municipality pages, no `municipalities` collection; the old `/provincia-de-barcelona*` URLs 301 to the zones index (`src/shared/i18n/retiredRoutes.ts`).
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
  - **Boundaries**: CartoBCN (districts, barrios, CC BY 4.0); ICGC (CC BY 4.0).
- Exact dataset IDs, endpoints, and update frequency: `TODO` (confirm per source). License/reuse terms for Portal de Dades, Open Data BCN, Notariado, and INCASÒL: `TODO` verify before publishing.
- Access ONLY through content collections (`marketStats`, `geo`) with loaders in `features/districts/infrastructure/`. Never hardcode figures in pages or components.
- Every metric is typed: `{ value, unit, year, provisional?: { value, until }, source, sourceUrl }`. Every figure displayed shows its source and year; provisional values are labeled.
- Attributions (CC BY) are rendered wherever data or boundaries are shown, and listed on the data sources page.
- If a metric is unavailable, show "not available" — never estimate or interpolate.

### 6.1 Client reviews

- Decision (client, 2026-10-30): reviews are typed by hand in Pages CMS (`testimonials` collection, one JSON file each in `src/content/testimonials`), so nothing is fetched from or stored through a Google API. Google's Places policy forbids storing its API content, which ruled out a cached API integration.
- The home shows the latest 3 (`LATEST_TESTIMONIALS`) with a notice of that criterion and a link to the Google profile (`home.reviews.mapsUrl`), where all of them can be read.
- Copy each text word for word, never improve it. Newest first, never picked to hide negative ones.
- Author with the name, photo and review link shown on Google (client decision). The photo is linked from Google, never copied, and stops showing if Google changes its URL. These links come from a Places API response, so review them with Google's policy and the lawyer before launch (I24).
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
- **Accessibility:** WCAG 2.2 AA; turquoise `accent` `#21CEC5` on light paper fails contrast (1.9:1): use it only for fills and rules. Focus rings and text/links on light backgrounds use `accent-tx` `#08777B` (5.2:1) or `petrol` `#0F5A5E` (7.9:1); `accent-2` `#058C93` only for text ≥ 24px; `taupe-tx` is `#6b6155` (AA, §11.2). No colour exceptions "as in the reference": ours win. On dark blocks `accent-tx` becomes `#21CEC5` (7.6:1). Full ratios per token in `docs/design-system/tokens.json` (§11.2).
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

## 11. Brand & design (source: HousySpace design system — decision 2026-11-09)

> The single visual reference is the **HousySpace design system** (Claude artifact `https://claude.ai/artifact/EGX5LwxCsGXaz29aYzsZtG`), generated from the client's static site `HOUSYSPACE-PS/housyspace-web@ef59e52`. A local copy lives in `docs/design-system/` and is what agents read:
>
> - `docs/design-system/README.md` — brand book (tone, colour, type, spacing, imagery, logos, icons). **Read it before any UI or copy work.**
> - `docs/design-system/tokens.json` (source of truth) and `tokens.css` (generated, CSS variables) — every colour, text style, spacing, radius and shadow, with its usage note and contrast ratio.
> - `docs/design-system/components/<Name>/README.md` — one per section of the reference site: where it appears, what it needs, rules.
> - `docs/design-system/assets/<Group>/README.md` — logos, seals, icons, illustrations, photos.
>
> This **supersedes** the 2026-11-07 prototype system (Cormorant Garamond, gold accent, ink/graphite, sentence case) and the older v3 artifact.
> **UI parity rule (client decision 2026-11-24, mandatory, wins over every other look/behaviour statement in this file and in the skills):** the UI of every page, section, component, state and breakpoint (1440, 820, 390) must be EXACTLY equal to the client's reference site (`C:\Users\Utente\Desktop\housyspace-web-ref`, always its current `HEAD`, served locally on port 4500). "Equal" means measured in Chrome, not "similar": same sections in the same order, same copy, same sizes, spacing, colours, weights, case, images, interactions, animations and transitions. When the reference changes, the project follows. When this file, the design system or a skill disagrees with the rendered reference on how something looks or behaves, the reference wins. Only these exceptions are allowed, each documented in the commit body: (1) WCAG 2.2 AA colour/contrast and focus (use the nearest passing token); (2) privacy and legal rules (§5 approximate location, §7 consent); (3) real data instead of the reference's demo data (Mobilia listings, client reviews, official figures); (4) the 4 locales and localized routes (§4); (5) `prefers-reduced-motion`; (6) **performance (client decision 2026-11-24):** the site is image- and video-heavy, so it must stay fast (§8: Lighthouse mobile ≥ 90, LCP < 2.5 s, budgets in `docs/performance.md`). Media must LOOK the same as the reference but never weigh like it: keep our own light encodes (e.g. the hero video stays `hero-corto-*` at 3-5 MB; the reference's 23 MB/12 MB AV1/H.264 files are NOT copied), every image through `<Picture {...PHOTO_PICTURE}>` (AVIF + WebP), one eager image per page, video only after idle and when visible, no extra scripts or fonts beyond what the reference's look requires. If parity and a budget collide, keep the budget and report the visual difference as an open item. Anything the reference does with JavaScript (steppers, popups, counters, parallax, animated SVG) is reproduced, with a small lazy script on `astro:page-load`; "not ported" is never an acceptable end state, only an interim one reported to the user as an open item.
> The reference site is plain HTML/CSS/JS: never copy its CSS or markup verbatim. Rebuild every section with this project's Tailwind v4 tokens, Astro components, Content Collections and i18n, so that the rendered result is identical.
> The component previews and the site's `css/` and image files are NOT in the repo; open the artifact when pixel-level detail is needed (layout at 1440 px, class names).

### 11.1 Look & feel

Sober and editorial: light paper, petrol green, a turquoise accent, ONE type family (Montserrat), always uppercase. Large real photography of Barcelona. Straight corners, almost no shadows: separation comes from alternating backgrounds and 1 px `line` rules.

- **Uppercase:** all site text is displayed in capitals, but HTML and the i18n dictionaries stay in normal case. The capitals come from CSS (`text-transform: uppercase`) so screen readers and Google read normal sentences. Headings (`h1`–`h4`) add `letter-spacing: .03em`. Today `global.css` uppercases `h1`–`h4`; the rest is uppercased per component (`uppercase`) until the full migration (`TODO` decide body-wide).
- **Shape:** `radius-0` by default (buttons, cards, photos, fields); `radius-4` only for pop-up windows and boxes; `radius-20` only for the district cards; `radius-full` for circles (carousel arrows, avatars). Shadows only on pop-ups (`sombra-ventana`), report sheets on dark (`sombra-ficha`) and the philosophy button (`sombra-boton`).
- **Focus:** visible everywhere: 2 px outline, offset 3 px, in the `accent` role (teal on paper, `#21CEC5` on dark blocks). Pure turquoise on paper is 1.9:1 and fails the 3:1 non-text minimum, so the design system's "outline in accent" is applied with the AA role.
- **Dark blocks** (video hero, photo headers, valuation, reviews, footer, mobile menu) use the `dark` theme: `.surface-dark` (or `data-theme="dark"`) on the block; components never branch on it, they use the role tokens below.

### 11.2 Colour

Define the tokens ONCE in `@theme` (values from `docs/design-system/tokens.json`; do not retype them from this file). **Tailwind names differ from the design system in these places:** Tailwind `canvas` = DS `bg`; Tailwind `accent` = DS `accent-tx` (text, links, focus); Tailwind `turquoise` = DS `accent` (pure `#21CEC5`, fills and rules only); Tailwind `dark` = DS `c-bg-dark`; `.surface-stone` = DS `c-bg-alt`. The table below lists the design-system names.

| Role token | Light | Dark block | Use |
| --- | --- | --- | --- |
| `c-bg` / `bg` | `#FCFBF8` | `#162B2A` | Page / block background (paper) |
| `c-bg-alt` / `bg-alt` | `#F3F1EB` | `#1B3331` | Alternate sections (`.bg-a` / `.bg-b`) |
| `card`, `card-h` | `#F3F1EB`, `#ECE8DF` | `#1D3533`, `#23403D` | Card and card hover |
| `fg`, `fg-2` | `#172B2B` | `#F7F5F1`, `#D8DEDC` | Main text |
| `muted` | `#67716F` | `#B4BFBE` | Secondary text |
| `line`, `line-2` | `rgba(23,43,43,.12/.2)` | `rgba(169,190,188,.16/.28)` | Rules, borders, fields |
| `accent-tx` | `#08777B` | `#21CEC5` | Turquoise for TEXT and links |
| `accent` | `#21CEC5` | `#21CEC5` | Turquoise for fills, rules and focus only |
| `petrol` | `#0F5A5E` | — | Brand green: service-card perimeter, accent fills (white text on it, 7.9:1) |
| `ok` `ko` `nd` `warn` `err` | see tokens | see tokens | States; ALWAYS with a word or icon, never colour alone |
| `ch-a` `ch-b` `ch-c` `ch-bar` `ch-grid` `ch-ax` | see tokens | see tokens | Charts and maps (§6.2) |

Brand constants (no theme): `ink` `#0B1214`, `teal` `#08777B`, `accent-2` `#058C93`, `stone` `#EBE5DC`, `taupe` `#A99F92`, `c-bg-dark` `#162B2A`.

Rules:

- Components use role tokens; never hardcode hex and never branch on the theme.
- `accent` on light fails as text (1.9:1): text and links use `accent-tx`. `accent-2` only for text ≥ 24 px. `taupe-tx` is `#6b6155` on light (darker than the design system's `#857a6c`, which gives 3.4 to 4.1:1): AA for any text size. Chart series `ch-b` `#9a7b4c` and `ch-c` `#6f7c79` pass 3:1 on cards. `c-text-2` (`muted`) on `bg-deep` (4.2:1) not for small text.
- Gold `#B8996A` and the Cormorant/ink/graphite system are **retired**. Remove them when touching a component; do not add new uses.

### 11.3 Typography

- **Montserrat** only (variable 400–900, Google Fonts `family=Montserrat:wght@400..900&display=swap`, latin + latin-ext; self-hosting through Fontsource is allowed if performance needs it).
- **Montserrat Titulares** = the same Montserrat declared with `size-adjust: 81.9%` for headings. The design system sizes were measured with it: where `size-adjust` is not available, multiply `titulares` sizes by 0.819. Implemented in `src/layouts/HeadingFontFace.astro` (`shared/lib/headingFont.ts`): the Fonts API cannot set `size-adjust`, so the heading `@font-face` reuses the body font's own files from `fontData` (no second download); use `font-heading`, never a hand-scaled size.
- Styles come from `tokens.json` `type.groups` (Titulares, Texto, Interfaz): headings 800/900 (`presentacion-h1`, `cabecera-h1`, `seccion-h2`, `pagina-h1`, `h2`), subtitles 700 (`h3`, `h3-s`), body 400 (`cuerpo` = 14 px / 1.7), buttons 500 wide-tracked (`boton`), labels 700 very wide-tracked (`rotulo`). Sizes are for 1440 px; large headings use `clamp()` and shrink on mobile.
- 10 px is the minimum size on the whole site (`legal`, `pie-enlace`).
- Headings mark their light-weight part with `*asterisks*` (`shared/lib/emphasis.ts`), never HTML (§3.2).
- **Objektiv Mk1**: logo SVG only, never re-typeset in HTML.

### 11.4 Layout

- Container `.wrap`: max `wrap-max` 1120 px, `wrap-pad` 22 px each side.
- Sections `.sec`: vertical padding `seccion-y` 76 px, `seccion-y-movil` 54 px below 760 px (the mobile breakpoint is **760 px**).
- Header height `cabecera-alto` 92 px desktop / `cabecera-alto-movil` 76 px mobile; anchors keep that gap (`scroll-padding-top`).
- Header: two states: transparent with dark theme over the hero photo/video, and solid (`glass` background) elsewhere. Mobile menu is a drop-down panel. Footer is a dark block.

### 11.5 Content & tone (Spanish is the source; en/it/ca keep the meaning)

- Address the client informally (es: tuteo, «Te asesoramos», «tu vivienda»; en/it/ca: the equivalent warm, direct register, `TODO` client review). Present as **consultores inmobiliarios, not an agency**: «Consultores inmobiliarios, no solo vendedores». Never «agencia pequeña».
- Fixed phrases, verbatim: «No te preocupes, yo me encargo» (always «yo», never «nos encargamos») and «UNA MILLA EXTRA» (never «una milla más»).
- «Los mejores» appears only in two sentences: «Rodearnos de los mejores también forma parte de nuestra filosofía.» and «Nos rodeamos de los mejores para ofrecerte mucho más.»
- Figures always rounded with «más de»: «+35 M€ intermediados», «+100 inmuebles», «+10 municipios», «9 años en el sector», «5 años de HousySpace». Never the exact figure.
- No emoji, no italics, no full stop at the end of headings, no numbered kickers («01 /») above them.
- Buttons use a clear verb: «Conócenos», «Enviar consulta», «Ver el mapa aquí».

### 11.6 Imagery, logos, icons

- **Photos:** real Barcelona architecture and streets (modernista facades, balconies, interiors); district photos are Shutterstock standard licence. Always `object-fit: cover`, straight corners. AI-generated placeholders must be replaced before launch.
- **Illustrations:** own, transparent background, for services and About us. If one was AI-generated, the footer says «Imagen conceptual generada con IA».
- **Logos:** `logo.svg` / `logo-oscuro.svg` on light paper; `logo-blanco.svg` on dark blocks and photos; isotype (`isotipo.svg`, `isotipo-blanco.svg`) only in small spaces and for favicon; `pin-housyspace.svg` is the map and valuation pin. Never stretch, recolour or rotate. Source: `logo/housyspace-completo-oficial.svg`; PNGs for social/OG only. Minimum size: full logo 140 px, isotype 24 px.
- **Seals (footer):** AICAT with its logo only; APEI with its logo and «Experto nº 3261» below.
- **Icons:** inline SVG, stroke only: `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, `stroke-width="2.2"`, round caps and joins, `aria-hidden="true"` next to text. No emoji, no icon fonts.

### 11.7 Page sections (components of the reference)

Each section of the reference site has a README under `docs/design-system/components/<Name>/`: where it appears, what the caller provides and its rules. Build the matching Astro component from it (§3.1) instead of inventing a layout:

- **Home:** `PortadaHero` (video, no text on it) · `Presentacion` · `Filosofia` · `InmueblesDestacados` · `DescubreBarcelona` · `CarruselServicios` · `Cifras` · `Valoracion` · `Resenas` · `BlogPortada`.
- **Properties:** `CatalogoCabecera` · `TarjetaInmueble` · `InmueblesVendidos` · `FichaInmueble`.
- **Services:** `ServicioCabecera` · `ServicioIncluye` · `ServicioPasos` · `Hablemos`.
- **About / Contact / Living in Barcelona:** `NosotrosCabecera` · `NosotrosSeccion` · `MillaExtra` · `ServiciosIntegrales` · `ContactoFormas` · `ContactoFormulario` · `PreguntasFrecuentes` · `MiBusquedaFormulario` · `Distritos` · `BarrioCabecera` · `BarrioDatos`.
- **Shared:** `Cabecera` · `Pie` · `Boton` · `Newsletter` · `TextoLegal`.

Where the reference and this file disagree on behaviour (real listings from Mobilia instead of demo ones, 4 locales, approximate location, consent rules), this file wins (the exceptions of the UI parity rule above); where they disagree on look or interaction, the rendered reference wins, then the design system. Some parts of the reference are static or popups (e.g. the Lystos valuator opens in a popup there): measure how it renders and behaves before deciding.

### 11.8 Motion

Brand easing `cubic-bezier(.2,.7,.2,1)`; scroll-reveal (fade + translateY 28 px) on section content via ONE IntersectionObserver on `astro:page-load`; image zoom on hover (scale 1→1.05, 700 ms); UI micro-transitions 250–350 ms. All disabled under `prefers-reduced-motion`. The design system does not define the previous system's scroll progress bar or hero Ken Burns: the Ken Burns was removed on 2026-11-24 (the poster is the video's first frame and stays still); keep the progress bar only if already built, recoloured with `accent` (`TODO` confirm with the client).

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
| `page-restyle` | Adapting a page to the client's reference site (texts + styles), CSS-first and measured in Chrome |
| `commit-per-task` | Finishing any task: one conventional commit per tested task, explaining what and why |

- Third-party skills: read the full content first (never import unreviewed scripts), then copy the folder into `.claude/skills/` or install via `/plugin marketplace add <owner/repo>` + `/plugin install <plugin>@<marketplace>` with project scope. Record the source in the skills index.
- Project subagents live in `.claude/agents/` (`restyle-living`, `restyle-about-contact`, `restyle-my-search`, `restyle-blog`, `restyle-legal`, `restyle-sell-valuation`): each owns a group of pages and loads `page-restyle`. Run parallel ones in separate git worktrees and merge their branches one by one.
- Claude Code entry point: `CLAUDE.md` contains `@AGENTS.md` so this file stays the single source of truth.

## 13. Agent rules

- Read this file before any task. If a request conflicts with it, ask.
- **UI = the reference site.** Any UI work ends only when the page is measured equal to the reference at 1440, 820 and 390 (§11 UI parity rule). Differences left over are listed as open items with the reason; never silently accepted as "by design".
- `ROADMAP.md` tracks phases, status, and client inputs. Check it before starting work; update its checkboxes and decisions log when a task lands. Never start work marked 🔒 until its input is resolved.
- Never invent listings, prices, legal text, company data, or translations of legal text. Exception (client, 2026-11-04): the legal drafts are machine-translated into en/it/ca and marked as pending lawyer review (§4).
- Do not change the stack or architecture, or add dependencies, without approval.
- Small, reviewable changes; tests and code ship together.
- Never duplicate code: reuse or extend existing components and helpers (section 3.1). Duplicated markup or logic is a defect.
- When requirements are ambiguous, ask one question and stop.
