# ROADMAP — HousySpace website

> Living plan. Update checkboxes as work lands. Spec lives in `AGENTS.md`; this file tracks **order, status, and blockers**.
> Legend: `[ ]` todo · `[~]` in progress · `[x]` done · 🔒 blocked by a client input (see section B).

## A. Client inputs (what the client must provide)

| # | Input | Unblocks | Status |
|---|-------|----------|--------|
| I1 | Mobilia connection credentials in `.env` | Phase 1, `bun run build`/`check` | ✅ sync OK (`astro check` 2026-10-22: 4 properties, 2 agents) |
| I19 | Fill `tituloWeb` (web title) in Mobilia for every property, in es/en/it/ca | Property titles and slugs | ⏳ pending |
| I2 | **Hosting provider** (Vercel / Netlify / Node server) | 301 redirects, form endpoint, Google reviews, scheduled rebuilds, launch | ⏳ pending |
| I3 | Email address that receives form submissions | Phase 4 | ⏳ pending |
| I4 | Company phone + WhatsApp (confirm 613 084 804 is the general number) | Header CTAs, contact | ⏳ pending |
| I5 | Confirm `isotipo.svg` / `logo-blanco.svg` from the UI proposal are official | Favicon, map marker | ⏳ pending |
| I6 | Google Places API key + Place ID (in `.env`) | Phase 8 reviews | ⏳ pending |
| I7 | Valuator URL / provider (+ `?lang=` support, cookies?) | Phase 8 valuator | ⏳ pending |
| I8 | Exact datasets (Portal de Dades, Open Data BCN, INCASÒL, INE, Idescat) + reuse licenses | Phases 5–6 | ⏳ pending |
| I9 | Page content (Services ×9, About, Living in Barcelona texts, Sell) in es (+ translations or approval to translate) | Phase 7 | ⏳ client has it |
| I10 | International guide content reviewed by tax advisor / law firm | Phase 7 | ⏳ pending |
| I11 | Legal texts (legal notice, privacy, cookies) validated by lawyer + Registro Mercantil data | Phase 9 | ⏳ pending |
| I12 | Rental-ad legal requirements in Barcelona (stressed area) confirmed by lawyer | Phase 3 listing details | ⏳ pending |
| I13 | Licensed hero video + Barcelona photos (author + license) — proposal media is AI-generated | Launch | ⏳ pending |
| I14 | Team photos and bios | About page | ⏳ pending |
| I15 | Confirm `reformas-interiorismo` service page is a leftover | Phase 7 | ⏳ pending |
| I16 | Mobilia API rate limits (ask Mobilia) | Rebuild frequency | ⏳ pending |
| I17 | Analytics tool choice | Phase 9 | ⏳ pending |
| I18 | Domain DNS access (housyspace.com). Registrar and DNS: **Webempresa** (`ns50041/ns50042.webempresa.eu`). At launch change ONLY the `@` and `www` records to the new host; never touch MX (email, see I21) | Launch | ⏳ pending |
| I20 | ⚠️ **Renew housyspace.com before 2026-12-19** (expiry date per the .com registry): confirm auto-renewal at Webempresa. If it lapses, website and email go down | Everything | ⏳ urgent |
| I21 | Email (`mail.housyspace.com`) is hosted on the Webempresa plan of the old WordPress: keep that plan for email, or migrate email first. Never cancel the hosting before deciding | Retiring the old WordPress | ⏳ pending |

## B. Phases

### Phase 0 — Foundation `[x]` (uncommitted)
- [x] Git repo, Astro 7 + TS strictest, Tailwind v4 brand tokens, fonts (Astro Fonts API + Fontsource)
- [x] i18n config (es default, prefixed), typed route map + `getLocalizedPath`, slugify
- [x] Base layout: ClientRouter, SEO head (canonical, hreflang, OG), skip link, header/footer placeholders
- [x] `astro:env` schema, `.env.example`, image remote host
- [x] Vitest (40 tests), Playwright + axe (52 tests), ESLint, Prettier, scripts
- [ ] First commit
- [ ] Decide island framework (Preact vs vanilla) — needed before Phase 3 filters
- [ ] CI pipeline (lint, check, typecheck, test, e2e, build) — after I2

### Phase 1 — Mobilia properties `[~]`
- [x] Connection test (4 properties: 3 sale, 1 rent; 2 agents) + sanitized fixtures
- [x] Domain `Property` (branded types) + Zod mapping
- [x] `properties` and `agents` collection loaders (incremental sync, desactivados)
- [x] Privacy rules (approximate location, never private address)
- [ ] Loader resilience: if Mobilia fails and a store exists, keep it and warn instead of failing `astro check`/build
- [ ] Scheduled rebuild (hourly, see `docs/content-sync.md`) 🔒 I2, I16

### Phase 2 — Design system & layout
- [x] Atoms/molecules/organisms used by the home
- [x] Header with dropdowns + mobile drawer + quick-action bar (phone number 🔒 I4)
- [x] Footer with company data, AICAT, legal links
- [x] Motion: intro (once per session), scroll progress bar, scroll-reveal, hero line reveal
- [x] Locale switcher
- [x] Home page: all 7 sections + contact block, real featured properties, en/it/ca machine-translated (pending client review)
- [ ] Confirm the white logo derived from the official SVG

### Phase 3 — Catalog & property detail
- [~] Catalog with URL-synced filters, sort, list/map view, clustered Leaflet map (ICGC tiles) — implemented + unit tests; `tests/e2e/catalog.spec.ts` and the catalog performance budget still to run against a build (🔒 I1 for `bun run build`). Map-area search ("buscar en esta zona") and district/barrio filters wait for Phase 5 geo data
- [x] Property card → detail shared-element morph (image, title, price)
- [~] Detail: gallery, facts, energy rating, virtual tour, approximate map, agent, similar properties, JSON-LD done — LeadForm 🔒 I3, I2
- [ ] Contact page (detail "request a viewing" CTA links to it, currently 404)
- [x] Performance pass: Lighthouse mobile home 99, sale detail 98, rent detail 100; e2e budget (`docs/performance.md`)
- [ ] Re-encode licensed hero video (AV1/VP9 + H.264, phone ≤720px ~1 Mbps) — needs `ffmpeg`
- [ ] Lighthouse CI (`@lhci/cli`, proposed, needs approval) once CI exists 🔒 I2
- [ ] Localized slugs + 301 rules 🔒 I2
- [ ] Rental-ad legal info 🔒 I12
- [~] Property PDF sheet (A4) — HTML source page per locale × property × operation (`src/pages/property-sheet-source/`), printed to `/pdf/housyspace-{ref}-{op}-{locale}.pdf` by `scripts/build-property-sheets.ts` after `astro build`; "Download sheet (PDF)" button on the detail. QR code + "View online" CTA open the property page in the sheet's language (decoded from the printed PDFs in es and en). Unit tests + layout checked by printing the 4 real properties from `astro dev`. Still to do: run `bun run build` + `tests/e2e/property-detail.spec.ts` (needs `bunx playwright install chromium`); hosting must run Chromium at build or CI must build (🔒 I2); en/it/ca sheet texts (disclaimer, documentation) machine-translated, pending client review

### Phase 4 — Leads & forms 🔒 I3, I2
- [ ] Shared `LeadForm` schema (client + server), honeypot, rate limit
- [ ] Variants: contact, property visit, custom search, sell
- [ ] Delivery to email
- [ ] Consent storage + privacy link

### Phase 5 — Living in Barcelona 🔒 I8
- [ ] `marketStats` + `geo` loaders (Portal de Dades, Open Data BCN, INCASÒL, CartoBCN)
- [ ] Choropleth map, barrio search, comparison table
- [ ] 10 district pages + 73 barrio pages with typed SVG charts
- [ ] Source/year/attribution on every figure

### Phase 6 — Barcelona province 🔒 I8
- [ ] Municipality data loader (INE, Idescat, ICGC boundaries)
- [ ] ~155 municipality pages + index

### Phase 7 — Content pages 🔒 I9, I10, I15
- [ ] Services index + service pages
- [ ] About / team 🔒 I14, Sell your property, Contact
- [ ] International guide
- [ ] Blog collection (index, article, empty state)
- [ ] Data sources page
- [ ] Translations en / it / ca

### Phase 8 — Integrations
- [ ] Google reviews (Places API, max 5, attributions, graceful fallback) 🔒 I6, I2
- [ ] Valuator iframe embed (origin-checked postMessage, CSP, consent) 🔒 I7

### Phase 9 — Compliance, SEO, performance
- [ ] Legal pages 🔒 I11; cookie consent banner; analytics after consent 🔒 I17
- [ ] JSON-LD (RealEstateAgent, Residence + Offer), sitemap, robots.txt
- [ ] Lighthouse ≥ 90 mobile, LCP < 2.5s, WCAG 2.2 AA audit in 4 locales
- [ ] CSP and security headers 🔒 I2

### Phase 10 — Launch 🔒 I2, I13, I18
- [ ] Replace AI-generated media with licensed assets
- [ ] Production env vars, adapter, scheduled rebuilds
- [ ] DNS + HTTPS, redirects from any old site URLs
- [ ] Google Search Console + sitemap submission
- [ ] Final QA pass (all locales, all page types)

## C. Decisions log

| Date | Decision |
|------|----------|
| 2026-10-20 | Astro + TS strictest, Astro i18n (es/en/it/ca, es default, all prefixed), translated URL segments |
| 2026-10-20 | Mobilia read-only via content collection loaders; no local DB |
| 2026-10-20 | Everything in the UI proposal is in scope |
| 2026-10-20 | Google reviews via Places API (max 5); valuator via external iframe |
| 2026-10-20 | Leaflet + ICGC tiles; own SVG charts; market data from Portal de Dades / INCASÒL / Open Data BCN |
| 2026-10-20 | Approved deps: prettier-plugin-tailwindcss, @axe-core/playwright |
| 2026-10-21 | Property detail data from the collection by ref (Mobilia has no single-property endpoint); 0 Mobilia calls per visit |
| 2026-10-21 | Islands in vanilla TS; Leaflet added; map circle ≥150 m when location is approximate; agent emails never shown |
| 2026-10-21 | Photos via `<Picture>` AVIF+WebP; hero video after load+idle, skipped on reduced motion/Save-Data/2G; Leaflet CSS+JS on demand; cards prefetch on viewport |
| 2026-10-21 | `turquoise-deep` restricted to large text/UI on light backgrounds (4.05:1); small text uses `petrol`/`teal` |
| 2026-10-21 | Rent detail URL `/{locale}/{alquiler, rent, affitto, lloguer}/{slug}-{ref}`; header not persisted (locale links change per page) |
| 2026-10-22 | Catalog: static page per operation, all cards server-rendered; vanilla island filters/reorders them. Query params (same in every locale): `zona tipo pmin pmax smin smax hab ban car orden vista` |
| 2026-10-22 | Catalog URL params parsed with full Zod (`astro/zod`) in the browser; catalog page gets its own JS budget (≈30 KB, to re-measure) |
| 2026-10-22 | Map clustering: own pure `clusterPoints` instead of Leaflet.markercluster (its UMD needs a global `L` and mutates the frozen ESM namespace; ~10 KB). AGENTS.md §2 stack table still lists markercluster — pending approval to update it |
| 2026-10-22 | Catalog map: approximate listings = hollow pin at the Mobilia zone centre (never the building); exact = solid pin |
| 2026-10-22 | Supersedes the two map rows above: location is ALWAYS approximate (zone circle ≥ 500 m, max zoom 16, no exact variant in the domain), on every map, the PDF sheet and JSON-LD. Maps always in colour (ICGC "estandard") |
| 2026-10-22 | Approved dep: `qrcode` (+ `@types/qrcode`) for the sheet QR. Only its encoder is used; the SVG is drawn by `QrCode.astro` with brand tokens |
| 2026-10-22 | Fix: Mobilia `latitudZona`/`longitudZona` equal the exact building coordinates for all 4 live properties, so circles were centred on the building. Centres are now snapped to a ≈ 550 m grid (`toApproximateCentre`) in the mapper; real coordinates removed from the test fixtures |
| 2026-10-22 | Property sheet: HTML is the source of truth, printed to a real PDF at build time (Playwright Chromium, already a devDependency); direct download via `<a download>`, no print dialog. Runtime PDF generation rejected (needs hosting). Static map for print: ICGC tiles + SVG circle computed at build (`staticMap.ts`), no Leaflet |
| 2026-10-22 | Package manager: bun replaces pnpm (`bun.lock`, `bun run <script>`; `bun test` is NOT Vitest). Scripts keep running on Node. LF line endings enforced by `.gitattributes`. Git repo created; client PDFs, local agent state and `.env*` stay out of it |
