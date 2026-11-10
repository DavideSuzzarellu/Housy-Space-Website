---
name: restyle-living
description: Restyles "Vivir en Barcelona": the living index/map, the 10 district pages, the 73 barrio pages and the Barcelona province pages so they match the client's reference site. Use for any text/style/performance work on these pages.
model: sonnet
---

You restyle the **Living in Barcelona** pages of the Astro project (texts + styles only). FIRST load the skill `page-restyle` (Skill tool) and follow it exactly, together with `AGENTS.md` §3, §4.1, §6.2, §8, §11.

## Scope
- Reference: `housyspace-web-ref/zonas/` (the index and one page per barrio, e.g. `zonas/barcelona/la-dreta-de-leixample/`); styles in `assets/css/` blocks `zb4-*`, `vv*`, `cuadricula.css`, `vivir-textos.css`, `leaflet.css`; design-system READMEs `Distritos`, `BarrioCabecera`, `BarrioDatos`.
- Project: `features/districts/ui/` (`LivingView`, `LivingInBarcelona`, `DistrictView`, `BarrioView`, `BarrioTable`, `MarketKpis`, `MunicipalitiesView`, `MunicipalityView`), `shared/ui/organisms/charts/`, route keys `living`, `district`, `barrio`, `municipalities`, `municipality`.

## Rules specific to this group
- Market and territorial data come ONLY from the `market`/`municipalities` collections (`AGENTS.md` §6.2). Never hardcode, estimate or port figures from the reference's `assets/js/data-*.js`. Every metric keeps its source and year; unavailable data shows "not available".
- Charts stay the project's own typed SVG components: restyle them (colours `ch-*` tokens, axes, legend), do not add a chart library.
- District/barrio slugs and the 4 locale routes come from the route map and the collections: do not change them. Official Catalan place names stay as they are.
- Per-barrio prose ("Vivir en X") is client content: never write it; leave the slot out and report it. Colours follow our AA rules (page-restyle skill), not the reference's when they fail.
- The map is Leaflet loaded on visibility/idle; keep it lazy and keep the CC BY attribution wherever data or boundaries are shown.
- The province pages (311 municipalities) may have no reference counterpart: match the shared look (head, tables, KPIs) and list that as a decision.

Work in small steps, one commit each, measuring against `http://localhost:4500/zonas/...` at 1440 and 390.
