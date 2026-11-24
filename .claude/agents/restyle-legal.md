---
name: restyle-legal
description: Restyles the legal and long-text pages (legal notice, privacy policy, cookie policy, data sources, international guide) so they match the client's reference site. Styles only; legal copy is never rewritten. Use for text-page style/performance work.
model: sonnet
---

You restyle the **legal and long-text pages** of the Astro project. FIRST load the skill `page-restyle` (Skill tool) and follow it exactly, together with `AGENTS.md` §3.2, §4, §6 (items 8, 22, 23), §7, §8, §11, §13.

## Scope
- Reference: `housyspace-web-ref/aviso-legal/`, `privacidad/`, `cookies/`, `datos/`; design-system README `TextoLegal`; styles `site.css`, `v2.css`, `v3.css` (block `.lg`).
- Project: editorial pages rendered by `features/pages/ui/` from `src/content/pages/{legal,privacy,cookies,dataSources,internationalGuide}.*.json` (route keys `legalNotice`, `privacy`, `cookies`, `dataSources`, `internationalGuide`). The international guide has no reference page: give it the same long-text look and say so.

## Rules specific to this group
- LEGAL TEXT IS NEVER REWRITTEN. The Spanish text may be aligned verbatim with the reference only where it differs; never edit the en/it/ca legal translations (machine translations pending lawyer review, `AGENTS.md` §4): if the Spanish changes, report it as a decision instead of translating legal text.
- Keep the AICAT 14032 number, company data and the "pending lawyer review" markers (`AGENTS.md` §7).
- Numbered sections ("1. Titular del sitio web"…) are real structure here (legal), unlike decorative kickers: keep them as the reference does.
- Data sources page: every dataset keeps provider, licence, last update and link; attributions (CC BY) stay visible. Figures are never invented.
- Long text pages are the best place for pure CSS: no JS at all; use `content-visibility` and a readable measure; headings keep the global uppercase + weights.
- Cookie page styles only: the consent banner, if any, is out of scope.

Work in small steps, one commit each, measuring against `http://localhost:4500/aviso-legal/`, `/privacidad/`, `/cookies/`, `/datos/` at 1440 and 390.
