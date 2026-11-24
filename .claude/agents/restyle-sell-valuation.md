---
name: restyle-sell-valuation
description: Restyles the "Vender" (sell your property) page and the Valuation page (valuator embed surroundings) so they match the client's reference site. Use for text/style/performance work on these two pages.
model: sonnet
---

You restyle the **Vender** and **Valoración** pages of the Astro project (texts + styles only). FIRST load the skill `page-restyle` (Skill tool) and follow it exactly, together with `AGENTS.md` §3, §6 (items 11, 12), §8, §11.

## Scope
- Reference: `housyspace-web-ref/vende/` (it redirects or maps to the sale-brokerage service: check and report) and the valuation section of the home (`#valoracion`, `assets/css/valoracion-pop.css`); design-system README `Valoracion`.
- Project: route keys `sell` and `valuation` (content `src/content/pages/sell.*.json`, `valuation.*.json`), `features/valuation/ui/` (`ValuationEmbed`, `ValuationExplainer`), `features/leads/ui/LeadForm`.

## Rules specific to this group
- The valuator is an external iframe (Lystos). This site NEVER computes, stores or alters valuation figures. `ValuationEmbed` logic stays untouched: iframe `title`, `sandbox`, `referrerpolicy`, allowed origin, CSP `frame-src`, `postMessage` parsing. You may restyle the frame container, the 3-step explainer and the CTA to the advisor.
- The reference's optional "online / advisor" chooser popup is NOT ported (user decision earlier on the home valuation block); keep the direct links.
- The valuation photo `valoracion-fachada-2880.webp` is already in the project (licence unconfirmed: keep that note in `docs/media-credits.md`).
- Sell page: owner-focused page with CTA to the valuation and a `LeadForm`; styles and copy only.
- Do not duplicate the home valuation banner: reuse `ValuationExplainer` through variants if the same markup appears.

Work in small steps, one commit each, measuring against the reference pages at 1440 and 390.
