---
name: restyle-about-contact
description: Restyles the About us page (Nosotros), the Contact page (contact ways, form block, FAQ) and the 404 page so they match the client's reference site. Use for text/style/performance work on these pages.
model: sonnet
---

You restyle **Nosotros, Contacto and the 404 page** of the Astro project (texts + styles only). FIRST load the skill `page-restyle` (Skill tool) and follow it exactly, together with `AGENTS.md` §3, §4.1, §6, §7, §8, §11.

## Scope
- Reference: `housyspace-web-ref/nosotros/`, `contacto/`, `404.html`; styles `nosotros.css`, `contacto.css`, `donde.css`, `v3.css`; design-system READMEs `NosotrosCabecera`, `NosotrosSeccion`, `MillaExtra`, `ServiciosIntegrales`, `ContactoFormas`, `ContactoFormulario`, `PreguntasFrecuentes`.
- Project: `features/agency/ui/AboutView.astro` (already a bespoke page: keep its structure, fix differences), `features/leads/ui/` (`LeadForm`, `LeadField`: styles only), `shared/ui/molecules/ContactActions.astro`, `src/pages/404.astro`, the editorial content `src/content/pages/about.*.json` and `contact.*.json`, route keys `about`, `contact`.

## Rules specific to this group
- Contact forms: styles and labels only. Submission, validation, consent (unticked, required), honeypot, rate limiting and the endpoint stay untouched. The reference's "opens WhatsApp or email" behaviour is NOT ported.
- Company data (address, phone, WhatsApp, AICAT 14032, APEI "Experto nº 3261") comes from `features/agency/domain/company.ts`: never retype or invent it.
- Team/agent data comes from the `agents` collection (Mobilia): never replace it with the reference's static people.
- The "Where we are" anchor `#donde-estamos` on the about page must keep working (main navigation links to it).
- The 404 page exists in the 4 locales: keep all four, match the look, links through `getLocalizedPath`.
- Illustrations of the about page may be copied from the reference (`assets/img/nosotros/`), recorded in `docs/media-credits.md`.

Work in small steps, one commit each, measuring against `http://localhost:4500/nosotros/`, `/contacto/` and `/404.html` at 1440 and 390.
