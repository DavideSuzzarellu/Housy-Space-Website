---
name: tailwind-css
description: "Trigger: Tailwind, styling, CSS, design tokens, colors, fonts, responsive, dark section. Style with Tailwind v4 brand tokens, contrast rules and mobile-first layout."
when_to_use: "Writing classes in any component, editing the global stylesheet or @theme tokens, or setting up Tailwind in astro.config."
metadata:
  author: "housyspace"
  version: "2.0"
---

# Tailwind CSS (v4)

## Activation Contract

Load for any styling work. Brand rules live in AGENTS.md §11; values live in `docs/design-system/tokens.json` (the HousySpace design system). This skill defines how to use them.

## Hard Rules

- Setup (Tailwind v4, CSS-first): `tailwindcss` + `@tailwindcss/vite`, registered in `astro.config` as `vite: { plugins: [tailwindcss()] }`; global stylesheet `src/styles/global.css` starts with `@import "tailwindcss";`. No `tailwind.config.js` and no `@astrojs/tailwind` integration.
- Tokens are defined ONCE in `@theme` in `src/styles/global.css`, with the values of `docs/design-system/tokens.json` and the Tailwind names of AGENTS.md §11.2. Reset the default palette with `--color-*: initial;` so only brand colors (plus `white`/`black`, declared explicitly) exist.
- Tailwind names differ from the design system in two places: `accent` = DS `accent-tx` (turquoise for text and links) and `turquoise` = DS `accent` (pure `#21CEC5`); `canvas` = DS `bg`, `dark` = DS `c-bg-dark`. Role tokens (`canvas`, `bg-soft`, `bg-deep`, `card`, `card-hover`, `line`, `fg`, `muted`, `accent`) change by surface via `.surface-dark` / `[data-theme="dark"]` and `.surface-stone`: components use roles and never branch on the theme.
- No hex/rgb values in components and no arbitrary color utilities (`bg-[#...]`, `text-[#...]`). Need a new color? Ask; add to §11 first.
- Contrast (WCAG 2.2 AA, §8): `turquoise` (#21CEC5) is 1.9:1 on paper, so on light it is only for fills, rules and decoration, never text. Text and links use `accent` (teal on light, #21CEC5 on dark blocks) or `petrol`. `turquoise-deep` and `taupe-tx` only for text ≥ 24px. Ratios per token are in `tokens.json`; verify any new pairing ≥ 4.5:1 (3:1 for large text/UI).
- Retired, never reintroduce: `gold`, `star`, `graphite`, `forest`, `font-serif` and Cormorant Garamond.
- Fonts: Montserrat is the only text font (`font-sans` body/UI, `font-heading` headings; weights 400–900). Uppercase is applied by CSS (`h1`–`h4` in `@layer base` plus `uppercase` on labels, buttons and nav), never typed in the HTML or the dictionaries; no italics (AGENTS.md §11.1, §11.3). Never use Objektiv Mk1 in text; the logo is the SVG.
- Shape: straight corners by default (`rounded-none`); `rounded` only per AGENTS.md §11.1 (pop-ups, district cards, circles). Almost no shadows: separation comes from alternating backgrounds and `line` rules.
- Mobile-first: unprefixed classes for mobile, then `sm:`/`md:`/`lg:`/`xl:`. No horizontal scroll at 320px.
- Repeated class groups become a component (or a variant), never a copy-pasted string (§3.1).

## Decision Gates

| Situation | Action |
|-----------|--------|
| Same class group needed twice | Extract or extend a component with a variant prop |
| Variant styling | Map typed prop → class string inside the component (object lookup), no dynamic class concatenation that hides full class names |
| Truly global base style (body, headings, focus ring) | `@layer base` in `global.css` |
| Dark section | `surface-dark` (or `data-theme="dark"`) on the block; use the role tokens inside. Solid dark fill outside a surface block: `bg-dark` |
| Alternate light section | `surface-stone` (DS `c-bg-alt`) |
| Gradient over a photo | `from-ink/…` `to-ink/…` (brand constant `ink`) |
| Class ordering | `prettier-plugin-tailwindcss` (approved, §2) sorts classes automatically; never reorder by hand against it |

## Execution Steps

1. Confirm the token exists in `@theme`; if not, stop and ask (do not invent colors).
2. Token block shape (values from `tokens.json` only; see the real one in `global.css`):
   ```css
   @theme {
     --color-*: initial;
     --color-petrol: #0f5a5e;
     --color-turquoise: #21cec5;
     --color-canvas: #fcfbf8;   /* role: redefined by .surface-dark */
     --color-accent: #08777b;   /* role: DS accent-tx */
     /* ...rest in global.css */
     --font-sans: var(--font-montserrat), ui-sans-serif, system-ui, sans-serif;
   }
   ```
3. Write markup with semantic elements, then mobile classes, then breakpoints.
4. Add visible focus styles (`focus-visible:` ring using a brand token with sufficient contrast on that background).
5. Decorative rules (1px `turquoise`/`line` dividers, note left borders) and photo tints: implement once as a component/utility in `shared/ui`, low presence.
6. Check: `rg -n "#[0-9a-fA-F]{3,8}\b" src --glob '!src/styles/global.css'` returns nothing new; `rg -n "\[#" src` returns nothing.
7. Run `bun run lint`, `bun run check`; visually verify at 320px, 768px, 1280px.

## Output Contract

Return: tokens used/added, contrast pairs verified, components extracted instead of duplicated classes, and check results.

## References

- `../../../AGENTS.md` §2, §3.1, §8, §11 and `../../../docs/design-system/` (README, tokens.json)
- Skills: `new-component`
