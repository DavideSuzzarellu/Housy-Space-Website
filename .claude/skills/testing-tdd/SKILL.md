---
name: testing-tdd
description: "Trigger: test, TDD, Vitest, Playwright, fixture, a11y check, any code change. Drive changes red/green/refactor with Vitest units and Playwright flows in 4 locales."
when_to_use: "Always, with any code change; especially domain/application logic, Mobilia loaders, components, pages, forms, and navigation."
metadata:
  author: "housyspace"
  version: "1.0"
---

# Testing (TDD)

## Activation Contract

Load with every code change (AGENTS.md §8, §12). Tests and code ship together (§13).

## Hard Rules

- Red → green → refactor: write the failing test, run it and see it fail for the right reason, implement the minimum, then refactor with tests green.
- Vitest for domain, application, infrastructure (loaders, mappers, schemas) and component rendering. Playwright for search, property detail, lead submission, navigation, in all 4 locales.
- Never hit real Mobilia in tests. Use recorded, sanitized fixtures (no secrets, no personal data, no `direccionPrivada`).
- Domain tests import no Astro, no infrastructure; pure functions, no mocks needed.
- Test behavior and public contracts, not implementation details. No snapshot-only tests for logic.
- Deterministic: freeze time for sync/date logic, no network, no ordering dependence.
- Approved test stack: Vitest, Playwright, `@axe-core/playwright` (§2). No other test dependencies (e.g. jsdom) without approval.

## Decision Gates

| Code under test | Tool | Mock |
|-----------------|------|------|
| Domain entities/rules, formatters, slugify, route map | Vitest | Nothing |
| Application use cases | Vitest | Repository/collection port with in-memory fakes |
| Mobilia loader, token cache, mappers, Zod schemas | Vitest | `fetch` (via `vi.stubGlobal` or injected client) returning fixtures; fake `store`/`meta`/`parseData` |
| `.astro` components | Vitest + `experimental_AstroContainer` (`astro/container`), `environment: "node"` | Props only |
| Islands | Vitest for logic; Playwright for interaction | Endpoint via Playwright `page.route` when testing UI states |
| Pages, transitions, forms, locale switch | Playwright against built/preview site | Nothing internal; external services stubbed |

## Execution Steps

1. Pick the smallest layer that proves the behavior (table above). Name tests by behavior: `it("excludes properties not published on web")`.
2. Vitest config via `getViteConfig()` from `astro/config` so Astro virtual modules resolve.
3. Fixtures: `__fixtures__/` next to the adapter; sanitized JSON from real responses (skill `mobilia-loader`). Build minimal variants in-test by spreading a base fixture.
4. Playwright: parameterize over `["es", "en", "it", "ca"]`; navigate with paths from the route map, not hard-coded strings where avoidable.
5. A11y checks in Playwright: one `<h1>`, `<html lang>` correct, accessible names via `getByRole`, keyboard-only flow for forms (Tab order, Enter submits), focus visible, run a project with `reducedMotion: "reduce"`. Run an automated `@axe-core/playwright` scan on every page type in every locale; zero serious/critical violations.
6. Lead form flow: client validation errors translated, honeypot rejected, success state shown without router navigation, endpoint mocked or pointed to a test destination (real destination is `TODO`, §6).
7. Run `bun run test` (and `bun run test:e2e` for UI/route changes), plus `bun run lint`, `bun run check` before commit (§9).

## Output Contract

Return: tests written first (names), red evidence, green result, refactors made, fixtures added/sanitized, commands run with pass/fail.

## References

- `../../../AGENTS.md` §3.2, §8, §9, §10, §13
- Skills: `mobilia-loader`, `new-component`, `view-transitions`, `localized-page`
