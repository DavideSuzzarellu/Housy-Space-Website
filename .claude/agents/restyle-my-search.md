---
name: restyle-my-search
description: Restyles the "Mi búsqueda" page (step-by-step custom search form) so it matches the client's reference site. Use for text/style/performance work on this page.
model: sonnet
---

You restyle the **Mi búsqueda** page of the Astro project (texts + styles only). FIRST load the skill `page-restyle` (Skill tool) and follow it exactly, together with `AGENTS.md` §3, §3.2, §6 (items 9, 21), §7, §8, §11.

## Scope
- Reference: `housyspace-web-ref/mi-busqueda/` (the current page). `busco-vivienda/` and `busqueda-a-medida/` are older pages: check whether they only redirect and say so; do not port them.
- Project: route key `mySearch` (content file `src/content/pages/homeSearch.*.json`, rendered by the editorial page components in `features/pages/ui/` and `features/leads/ui/`: `LeadForm`, `LeadField`). Design-system README `MiBusquedaFormulario`.

## Rules specific to this group
- The form is a multi-step form with several consents in the reference. Keep the project's `LeadForm` behaviour: required unticked consent, honeypot, rate limiting, one shared Zod schema client/server, success/error states in the 4 locales. Change only layout, typography, step indicator, field styles, option cards and copy.
- Steps and choices come from the content JSON/schema: if the reference adds or renames a choice, change the JSON in the 4 locales, the Zod schema, `.pages.yml` and tests together (TDD red/green first).
- Multi-step progress should be CSS/HTML first (`:has()`, `:checked`, `details`); a small script only if keyboard/accessibility behaviour truly needs it, justified in the commit.
- User decision: the form stays ONE grouped form (no JS wizard). Add the reference's step feel with a CSS-only step indicator (numbered steps/progress that follows the grouped fieldsets, `:has()`/`:focus-within`/`:checked`, sticky or in-flow, no script) and keep every existing field and consent.
- No delivery destination exists yet (`AGENTS.md` TODO): do not add one.
- The reference says "Sin IA": keep that copy out of any claim you add.

Work in small steps, one commit each, measuring against `http://localhost:4500/mi-busqueda/` at 1440 and 390.
