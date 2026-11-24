# UI migration — HousySpace design reference (2026-11-09)

> **Design reference changed 2026-11-09** (client decision). The sole reference is now the
> **HousySpace design system** (`docs/design-system/`, source artifact `EGX5LwxCsGXaz29aYzsZtG`).
> It supersedes the 2026-11-07 prototype (Cormorant Garamond, gold, ink) and proposal v3.
>
> - Typography: Montserrat only, headings 800/900, uppercase by CSS.
> - Accent: turquoise (`accent` for fills, `accent-tx` for text); gold is retired.
> - Surfaces: paper `#FCFBF8`, alternate `#F3F1EB`, dark petrol blocks `#162B2A`.
> - Straight corners, almost no shadows. Copy rules in AGENTS.md §11.5.
> - `AGENTS.md` §11 rewritten; the 2026-11-07 notes below are historical.
>
> Earlier decisions of 2026-11-04 still stand:
>
> - **All copy is translated into es/en/it/ca.**
> - Route structure, page list, and content architecture unchanged.

## 0. Why v3 and not the Design canvas (evidence)

|                            | Design canvas (25/10)                                                                                                                             | v3 (02/11)                                                                                                                                                                 | Project today |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| Home headings              | no featured heading; "La próxima propiedad podría ser la tuya"; "Un servicio integral…"; «No te preocupes, yo me encargo».; "distrito a distrito" | "Encuentra aquí tu nuevo comienzo"; "Descubre cuánto vale tu vivienda"; "Descubre todo lo que podemos hacer por ti"; "¡No te preocupes, yo me encargo!"; "barrio a barrio" | = v3          |
| Home order                 | valuation → philosophy → reviews → services                                                                                                       | valuation → services → philosophy → reviews                                                                                                                                | = v3          |
| Services                   | 8, interior design apart                                                                                                                          | 9 (legal/tax, financial; "Reformas e interiorismo")                                                                                                                        | = v3          |
| Services index / Sell page | full pages                                                                                                                                        | `servicios/` → home `#servicios`; `vende/` → sale-brokerage service (redirects)                                                                                            | = v3          |
| CSS                        | unreadable (`/_blob`)                                                                                                                             | `assets/css/v3.css` readable, already contains the canvas page classes (`ph3`, `pc3`, `cat3`, `ns-net`, `kp3`, `vv3`, `svp-*`)                                             | built from v3 |

## 1. Sync baseline

- The project was last synced with v3 on **2026-10-30** (commit `feat(pages): add all proposal pages and their content in Spanish`), plus the reviews change of 2026-11-04.
- v3 styles are layered in dated change blocks. Blocks dated **29/10 → 02/11** are the gap candidates:

| Block        | Date     | Change                                                                                                           | In project?                                       |
| ------------ | -------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `nl6`, `nl7` | 29–30/10 | Footer: big "¡Hablemos!" without sentence; smaller newsletter with collapsible privacy info                      | ❌ newsletter left out (decision 2026-10-30) → Q3 |
| `vv6`, `vv7` | 29–30/10 | Living in Barcelona v6/v7: larger open district map, finer type, full-width charts, web palette (stone → petrol) | ⚠️ to verify (Phase 4)                            |
| `bvw`, `bv2` | 29–30/10 | "Busco vivienda" step-by-step form, editorial redesign                                                           | ⚠️ to verify; v3 now names it "Mi búsqueda" → Q2  |
| `hn7`        | 30/10    | Header without "Hablemos"; menu inline where it fits                                                             | ⚠️ project still shows "Let's talk" beside "Menu" |
| `lg9`        | 30/10    | Home: logo slightly larger at the very top                                                                       | ⚠️ to verify                                      |
| `cb8`        | 01/11    | About · collaborations closing text, full width, "No te preocupes, yo me encargo" as lead                        | ⚠️ to verify                                      |
| `aic`        | 01/11    | White transparent AICAT seal on the dark footer (190 px)                                                         | ⚠️ to verify                                      |
| `rs4`        | 01/11    | Reviews minimalist redesign (gold stars, provisional/real states)                                                | ⚠️ partly (reviews typed in Pages CMS)            |
| `rd5`        | 02/11    | Instagram + LinkedIn logos after Call · WhatsApp · Email · Tell us                                               | ❌ missing                                        |
| `pie`        | 02/11    | Footer: only AICAT and APEI logos, "Experto nº 3261" under APEI                                                  | ❌ APEI left out (I23) → Q3                       |

Texts may also have changed in the HTML pages without a CSS block; each page is diffed in Phase 4.

## 2. Design tokens (design system vs `src/styles/global.css`)

Applied 2026-11-09 — `global.css`, `astro.config.ts` and the skills `tailwind-css` / `new-component` updated. Values come from `docs/design-system/tokens.json`; Tailwind names are mapped in AGENTS.md §11.2.

| Role                 | Design system                    | Project                                           | Status                      |
| -------------------- | -------------------------------- | ------------------------------------------------- | --------------------------- |
| canvas               | `c-bg` `#FCFBF8`                 | `--color-canvas`                                  | ✅                          |
| fg / muted           | `#172B2B` / `#67716F`            | `--color-fg` / `--color-muted`                    | ✅                          |
| accent (text, focus) | `accent-tx` `#08777B`            | `--color-accent` (role)                           | ✅                          |
| turquoise (fills)    | `accent` `#21CEC5`               | `--color-turquoise`                               | ✅                          |
| line / card          | `rgba(23,43,43,.12)` / `#F3F1EB` | `--color-line` / `--color-card`                   | ✅                          |
| dark block           | `c-bg-dark` `#162B2A` + roles    | `.surface-dark`, `[data-theme="dark"]`, `bg-dark` | ✅                          |
| alternate section    | `c-bg-alt` `#F3F1EB`             | `.surface-stone`                                  | ✅                          |
| heading font         | Montserrat 800/900, uppercase    | `--font-heading` + `@layer base` h1–h4            | ✅ (sizes per component ⚠️) |
| body font            | Montserrat 400                   | `--font-sans`, weights 400–900                    | ✅                          |
| shape / shadows      | `radius-0`, almost no shadows    | per component                                     | ⚠️ to audit                 |
| charts               | `ch-a/b/c/bar/grid/ax`           | `charts/*` still use `accent` / `taupe`           | ⚠️ not mapped               |
| states               | `ok ko nd warn err`              | `ok ko warn err` in `@theme` (`nd` missing)       | ⚠️ unused yet               |

Retired and removed: `gold`, `star`, `graphite`, `forest`, `font-serif`, Cormorant Garamond.
Done 2026-11-09: the `size-adjust: 81.9%` heading face (`layouts/HeadingFontFace.astro`) and no italics (global rule).
Not done yet: per-component layout, heading sizes tuned for Cormorant, body-wide uppercase, and the DS section layouts (§11.7). Home map: one commit per step (type scale → button → motion → hero → …).

## 3. Page mapping (v3 path ↔ project route)

| v3 path                                                           | Route key                           | Project view                                                          |
| ----------------------------------------------------------------- | ----------------------------------- | --------------------------------------------------------------------- |
| `index.html`                                                      | `home`                              | `pages/[locale]/index.astro`                                          |
| `propiedades/index.html`                                          | `sale`, `rent`                      | `PropertyCatalog`                                                     |
| `propiedades/<slug>-demo-00x/`                                    | `saleDetail`, `rentDetail`          | `PropertyDetail` (+ PDF sheet)                                        |
| `servicios/<9 slugs>/`                                            | `serviceDetail`                     | `PageView` + `OtherServices`                                          |
| `zonas/barcelona/index.html`                                      | `living`                            | `LivingView`                                                          |
| `zonas/barcelona/distritos/<d>/`                                  | `district`                          | `DistrictView`                                                        |
| `zonas/barcelona/<barrio>/`                                       | `barrio`                            | `BarrioView`                                                          |
| `nosotros/` (incl. `#donde-estamos`)                              | `about`                             | `PageView`                                                            |
| `contacto/`                                                       | `contact`                           | `PageView`                                                            |
| `mi-busqueda/` (`busco-vivienda/`, `busqueda-a-medida/` redirect) | `homeSearch` + `customSearch` today | Q2                                                                    |
| `blog/`                                                           | `blog`, `blogPost`                  | `BlogIndex`, `PostView`                                               |
| `datos/`                                                          | `dataSources`                       | `PageView`                                                            |
| `aviso-legal/`, `privacidad/`, `cookies/`                         | legal routes                        | `PageView`                                                            |
| `404.html`                                                        | 404                                 | `pages/404.astro`                                                     |
| `servicios/index.html`, `vende/index.html`                        | `services`, `sell`                  | redirects in v3 → keep without pages                                  |
| —                                                                 | `valuation`, `internationalGuide`   | exist in the project, no v3 page in this version → keep, verify links |

## 4. Translation scope

| Content                                     | Today                                                     | Work                                                      |
| ------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------- |
| UI dictionaries `shared/i18n/{en,it,ca}.ts` | translated                                                | update new keys only                                      |
| `content/home/*.json`                       | 4 locales (machine-translated)                            | re-sync with v3 copy                                      |
| `content/pages/*.es.json`                   | **21 files, Spanish only (~166 KB)**                      | translate to en/it/ca → 63 new files, add to `.pages.yml` |
| District prose / Living texts               | Spanish only (`fallback` in `LivingView`, `DistrictView`) | translate                                                 |
| Barrio pages                                | translated                                                | —                                                         |
| Legal pages (`legal`, `privacy`, `cookies`) | Spanish drafts pending lawyer (I11)                       | Q1                                                        |
| Reviews, blog articles, Mobilia data        | —                                                         | never translated                                          |

Translations are marked "pending client review" in ROADMAP (as the home ones). Once a page has its 4 files, its `noindex` fallback disappears.

## 5. Plan

1. **Phase 2 — tokens + layout:** token alignment (§2); header without "Let's talk"; nav per AGENTS §6 (Q2 for "Mi búsqueda"); "Dónde estamos"; footer per v3 (Q3).
2. **Phase 3 — components:** only those the page diffs require (charts palette, reviews, footer seals/social, anything found in §1).
3. **Phase 4 — pages, one at a time** (Main → Services template → Properties + detail → Valuation → About → Contact → Living + district/barrio → Blog → Mi búsqueda, Data, legal, 404). Per page: read its v3 HTML, diff copy and layout against the project, fix, translate its content into en/it/ca, compare desktop/mobile, AGENTS checklist, summary, stop for OK.
4. **Phase 5 — cleanup:** remove dead components/keys/CSS, e2e + a11y + performance budgets, ROADMAP update.

## 6. Risks

| #   | Risk                                                                                                               | Mitigation                                                                                      |
| --- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| R1  | Copy changes in v3 HTML without a CSS block go unnoticed                                                           | Text diff per page (Phase 4), not only CSS blocks                                               |
| R2  | 63 new content files must match `pageSchema` and `.pages.yml` (tested)                                             | Translate structure-preserving (same items, only strings change); run the schema tests per page |
| R3  | Machine translation quality (en/it/ca)                                                                             | Mark as pending client review; keep proper names, place names and figures unchanged             |
| R4  | Route change for "Mi búsqueda" needs redirects; GitHub Pages only does meta-refresh (not acceptable for SEO, §4.1) | Q2                                                                                              |
| R5  | Performance budgets with footer seals, social icons, newsletter                                                    | Inline SVG, no new JS                                                                           |

## 7. Answers (client, 2026-11-04)

- **Q1 — Legal texts:** translate them now, marked pending lawyer review; they will be replaced later.
- **Q2 — "Mi búsqueda":** new route `mySearch` (`/es/mi-busqueda`, `/en/my-search`, `/it/la-mia-ricerca`, `/ca/la-meva-cerca`); `homeSearch` and `customSearch` retired (301s wait for hosting, I2).
- **Q3 — Footer:** newsletter, email, opening hours and APEI seal included exactly as in v3.
