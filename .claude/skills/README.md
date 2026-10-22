# Project skills index

Skills for agents working on the HousySpace website. `AGENTS.md` is the single source of truth; if a skill conflicts with it, `AGENTS.md` wins and the skill must be fixed (AGENTS.md §12).

| Skill | Purpose | Source |
|-------|---------|--------|
| [`mobilia-loader`](mobilia-loader/SKILL.md) | Build/change read-only Mobilia content loaders: token cache, paging, filters, incremental sync, Zod mapping to `Property`, privacy, fixtures, tests | project-authored |
| [`new-component`](new-component/SKILL.md) | Create or extend UI components: atomic placement, search-before-create, typed props/variants, a11y and no-duplication checklists | project-authored |
| [`localized-page`](localized-page/SKILL.md) | Add a page in es/en/it/ca: route map, i18n strings, `pages` collection entry, canonical/hreflang, sitemap, tests | project-authored |
| [`view-transitions`](view-transitions/SKILL.md) | ClientRouter, transition-name helper, card→detail morphs, `transition:persist`, `astro:page-load` scripts, forms, reduced motion | project-authored |
| [`tailwind-css`](tailwind-css/SKILL.md) | Tailwind v4 CSS-first setup, brand tokens in `@theme`, contrast rules, mobile-first, component extraction, class ordering | project-authored |
| [`astro-best-practices`](astro-best-practices/SKILL.md) | Zero-JS islands, static vs on-demand rendering, `astro:env` secrets, `Image`/`Picture`, collections via use cases, endpoints, performance | project-authored |
| [`seo-multilingual`](seo-multilingual/SKILL.md) | Metadata, canonical, hreflang + x-default, JSON-LD, i18n sitemap, slug and 301 rules | project-authored |
| [`testing-tdd`](testing-tdd/SKILL.md) | Red/green/refactor with Vitest (domain, application, loaders, components) and Playwright (4-locale flows, a11y) | project-authored |
| [`commit-per-task`](commit-per-task/SKILL.md) | Close every finished, tested task with one conventional commit explaining what and why; check gate chained to the commit; never-commit list | project-authored |

## Importing third-party skills

1. Read the full content first (SKILL.md, scripts, assets). Never import unreviewed scripts.
2. Install either way, with project scope:
   - Copy the skill folder into `.claude/skills/<skill-name>/`, or
   - `/plugin marketplace add <owner/repo>` then `/plugin install <plugin>@<marketplace>`.
3. Add a row to the table above with the source (`<owner/repo>` and version/commit) instead of `project-authored`.
4. Check it does not conflict with `AGENTS.md`; adapt or drop it if it does.
