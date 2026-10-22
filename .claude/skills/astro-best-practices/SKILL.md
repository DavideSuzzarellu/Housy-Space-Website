---
name: astro-best-practices
description: "Trigger: Astro, island, client directive, prerender, SSR, astro:env, Image, endpoint, performance. Apply HousySpace Astro rules for rendering, islands, env, images and endpoints."
when_to_use: "Choosing rendering mode, adding an island, reading env vars, rendering images, writing src/pages/api endpoints, editing astro.config, or performance work."
metadata:
  author: "housyspace"
  version: "1.0"
---

# Astro best practices

## Activation Contract

Load for architecture-level Astro decisions: rendering, hydration, config, env, images, endpoints, performance.

## Hard Rules

- Zero JS by default; islands only for filters, gallery, map, forms (AGENTS.md §2, §3). Prefer `client:visible`; justify any `client:load`. Island framework is `TODO` in §2: ask before adding one.
- Static by default (`output: "static"`). On-demand rendering only per route with `export const prerender = false`, which requires an adapter; adapter/hosting is `TODO` (§2), so ask before relying on it.
- Adapter-agnostic: no provider-specific APIs outside `astro.config` (§2).
- Secrets only via `astro:env`: declare in `env.schema` with `envField.string({ context: "server", access: "secret" })`, import from `astro:env/server`. Never `import.meta.env` for secrets, never in client code, never logged. Never read `.env`.
- Content only via Content Collections, queried with `getCollection()`/`getEntry()` inside `features/*/application` use cases; pages/components call use cases (§3.2). No ad-hoc `fetch` to Mobilia.
- Content config in `src/content.config.ts`; import `z` from `astro/zod` and loaders from `astro/loaders`.
- Every photo uses `<Image />` or `<Picture />` from `astro:assets` with `alt` (§8). Remote Mobilia photos come from `media.mobiliagestion.es`: allow it via `image.remotePatterns` (`protocol: "https"`, `hostname: "media.mobiliagestion.es"`); strip tracking query params (`utm_*`) from photo URLs in the mapper; pass `width`/`height` for remote images.
- Above-the-fold hero/LCP image: `priority` prop (sets eager loading, sync decoding, high fetchpriority). Everything else stays lazy (default).
- `trailingSlash: "never"`; i18n config per §4.1 (`prefixDefaultLocale: true`).
- No new dependencies without approval (§2, §13).

## Decision Gates

| Need | Choice |
|------|--------|
| Content changes only on rebuild | Static page (default) |
| Per-request data (form POST, rate limiting) | Endpoint in `src/pages/api/*.ts` with `prerender = false` (adapter needed) |
| Near real-time listings required | Live collection (`defineLiveCollection` in `src/live.config.ts`) per §3.2; ask first |
| Interaction on scroll into view | `client:visible` |
| Interaction needed immediately (above fold) | `client:load`, documented |
| Redirect `/` → `/es` with 301 | `redirects` in config: real 301 needs an adapter or host rules; static-without-adapter emits a meta refresh only |

## Execution Steps

1. Identify layer: page (thin composition) → use case (`application`) → domain → infrastructure. Put code in the right folder (§3).
2. Choose rendering mode and hydration from the table; record why in the commit body if not the default.
3. Endpoints: parse input with the shared Zod schema (same as client), honeypot + rate limit, return typed JSON, never echo CRM/internal errors (§6, §8). Lead destination is `TODO` (§6): do not wire any Mobilia write endpoint.
4. Images: local assets imported from `src/assets/`; remote via authorized domains; meaningful localized `alt`; `priority` only on the LCP image.
5. Performance budget (§8): Lighthouse mobile ≥ 90, LCP < 2.5 s, no CLS from images or transitions. Check JS shipped per page after `pnpm build` (no unexpected island bundles).
6. Run `pnpm check`, `pnpm test`, `pnpm build`.

## Output Contract

Return: rendering mode and hydration choices with reasons, env vars declared (names only), image config changes, endpoints added, and build/check results.

## References

- `../../../AGENTS.md` §2, §3, §3.2, §4.1, §5, §6, §8, §13
- Skills: `mobilia-loader`, `view-transitions`, `seo-multilingual`, `testing-tdd`
