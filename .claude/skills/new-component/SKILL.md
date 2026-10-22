---
name: new-component
description: "Trigger: new component, extend component, atom, molecule, organism, island, UI. Place, reuse or extend UI components with atomic design, typed props and a11y."
when_to_use: "Creating, extending, or refactoring any .astro component or island in shared/ui or a feature ui/ folder."
metadata:
  author: "housyspace"
  version: "1.0"
---

# New component

## Activation Contract

Load before creating or changing any visual element. Also load `tailwind-css` and `testing-tdd`; load `view-transitions` if the component carries `transition:*` directives.

## Hard Rules

- Search before create (AGENTS.md §3.1). Duplicated markup, logic, or class groups are defects.
- Variants via typed props (`variant`, `size`, `tone`), never a copy with a new name.
- One component per file, PascalCase, `interface Props` typed, no `any`.
- No user-facing literals: text comes from `shared/i18n/{locale}.ts` or from props.
- Styling only with Tailwind brand tokens (skill `tailwind-css`); no hex values, no inline `style` colors.
- Components never call `getCollection()`/`getEntry()` or Mobilia; data arrives via props from pages/use cases (§3.2).
- Zero JS by default: `.astro` first; an island only for real interaction (filters, gallery, map, forms), hydrated with `client:visible` unless above the fold needs otherwise (§3).
- Formatting via `shared/lib/format`; URLs only via `getLocalizedPath`; transition names only via `shared/lib/transitionNames.ts`.

## Decision Gates

| Question | Placement |
|----------|-----------|
| Indivisible, business-agnostic (Button, Input, Badge, Icon) | `src/shared/ui/atoms/` |
| Small group of atoms, business-agnostic (FormField, PriceTag, PropertyFact) | `src/shared/ui/molecules/` |
| Section-level composition (Header, Footer, LeadForm, PropertyCard, PropertyGallery) | `src/shared/ui/organisms/` |
| Only meaningful inside one feature and not reused elsewhere | `src/features/<feature>/ui/` |
| Similar component exists | Extend it with a prop/variant; do not fork |
| Same markup/classes appear a second time | Extract now (rule of two) |
| Needs client state/events | Island; keep the static shell in `.astro` |

## Execution Steps

1. Search: `rg -il "<Name>|<role keyword>" src/shared/ui src/features/*/ui` and `rg "class=\"<distinctive classes>" src`. Read close matches.
2. Decide: extend existing (add prop/variant) or create new, using the table above. Note the decision in the PR/commit body.
3. Write the failing test first (skill `testing-tdd`): render with Astro Container API (`experimental_AstroContainer` from `astro/container`) and assert output for each variant and state.
4. Define `interface Props` with explicit unions for variants, defaults in destructuring, `class?: string` passthrough only if needed for layout.
5. Implement with semantic HTML first (button for actions, a for navigation, lists, headings in order); slots for composition.
6. Accessibility checklist (WCAG 2.2 AA, §8):
   - [ ] Accessible name for every control (`aria-label` text from i18n when no visible label).
   - [ ] Visible focus style; full keyboard operation; no keyboard trap.
   - [ ] Contrast: `turquoise` only on dark backgrounds; on light, `turquoise-deep` only for large text/UI; small text and links use `petrol` or `teal` (§8).
   - [ ] Target size ≥ 24×24 CSS px.
   - [ ] Images via `<Image />`/`<Picture />` with meaningful `alt` (empty `alt=""` only if decorative).
   - [ ] Form inputs have `<label>`, errors linked with `aria-describedby`, status via `aria-live`.
   - [ ] No motion that ignores `prefers-reduced-motion`.
7. No-duplication checklist:
   - [ ] No existing component covers this with a new prop.
   - [ ] No copy-pasted class string from another file.
   - [ ] No repeated formatting/URL/transition-name logic.
   - [ ] Shared Zod schema reused for client + server validation (forms).
8. Run `bun run test`, `bun run lint`, `bun run check`.

## Output Contract

Return: placement decision (atom/molecule/organism/feature) and why, reused/extended components, Props signature, checklists status, tests added and results.

## References

- `../../../AGENTS.md` §3, §3.1, §3.2, §6 (LeadForm), §8, §11
- Skills: `tailwind-css`, `testing-tdd`, `view-transitions`, `astro-best-practices`
