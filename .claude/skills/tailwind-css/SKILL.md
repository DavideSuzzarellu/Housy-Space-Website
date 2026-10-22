---
name: tailwind-css
description: "Trigger: Tailwind, styling, CSS, design tokens, colors, fonts, responsive, dark section. Style with Tailwind v4 brand tokens, contrast rules and mobile-first layout."
when_to_use: "Writing classes in any component, editing the global stylesheet or @theme tokens, or setting up Tailwind in astro.config."
metadata:
  author: "housyspace"
  version: "1.0"
---

# Tailwind CSS (v4)

## Activation Contract

Load for any styling work. Brand values live in AGENTS.md §11; this skill defines how to use them.

## Hard Rules

- Setup (Tailwind v4, CSS-first): `tailwindcss` + `@tailwindcss/vite`, registered in `astro.config` as `vite: { plugins: [tailwindcss()] }`; global stylesheet `src/styles/global.css` starts with `@import "tailwindcss";`. No `tailwind.config.js` and no `@astrojs/tailwind` integration.
- Tokens are defined ONCE in `@theme` in `src/styles/global.css`, named exactly as §11. Reset the default palette with `--color-*: initial;` so only brand colors (plus `white`/`black` if needed, declared explicitly) exist.
- No hex/rgb values in components and no arbitrary color utilities (`bg-[#...]`, `text-[#...]`). Need a new color? Ask; add to §11 first.
- Contrast (WCAG 2.2 AA, §8): `turquoise` (#21CEC5) only on dark backgrounds (`petrol-dark`, `petrol`, `bg-dark-*`). On light backgrounds: `turquoise-deep` only for large text and non-text UI (4.05:1); normal-size text and links use `petrol` or `teal`. Verify any other new pairing ≥ 4.5:1 (3:1 for large text/UI).
- Fonts: `font-sans` = Montserrat (body/UI), `font-serif` = Cormorant Garamond (editorial headings, property titles). Never use Objektiv Mk1 in text; the logo is the SVG.
- Mobile-first: unprefixed classes for mobile, then `sm:`/`md:`/`lg:`/`xl:`. No horizontal scroll at 320px.
- Repeated class groups become a component (or a variant), never a copy-pasted string (§3.1).

## Decision Gates

| Situation | Action |
|-----------|--------|
| Same class group needed twice | Extract or extend a component with a variant prop |
| Variant styling | Map typed prop → class string inside the component (object lookup), no dynamic class concatenation that hides full class names |
| Truly global base style (body, headings, focus ring) | `@layer base` in `global.css` |
| Dark section | `bg-bg-dark-1/2/3` or `bg-petrol-dark`, white/grey text, `turquoise` accents allowed |
| Class ordering | `prettier-plugin-tailwindcss` (approved, §2) sorts classes automatically; never reorder by hand against it |

## Execution Steps

1. Confirm the token exists in `@theme`; if not, stop and ask (do not invent colors).
2. Token block shape (values from §11 only):
   ```css
   @theme {
     --color-*: initial;
     --color-petrol-dark: #14282b;
     --color-turquoise-deep: #058c93;
     /* ...rest of §11, incl. bg-dark-1/2/3 */
     --font-sans: "Montserrat", ui-sans-serif, system-ui, sans-serif;
     --font-serif: "Cormorant Garamond", ui-serif, Georgia, serif;
   }
   ```
3. Write markup with semantic elements, then mobile classes, then breakpoints.
4. Add visible focus styles (`focus-visible:` ring using a brand token with sufficient contrast on that background).
5. Graphic resource lines (38.6°) and photo tints: implement once as a component/utility in `shared/ui`, low presence.
6. Check: `rg -n "#[0-9a-fA-F]{3,8}\b" src --glob '!src/styles/global.css'` returns nothing new; `rg -n "\[#" src` returns nothing.
7. Run `bun run lint`, `bun run check`; visually verify at 320px, 768px, 1280px.

## Output Contract

Return: tokens used/added, contrast pairs verified, components extracted instead of duplicated classes, and check results.

## References

- `../../../AGENTS.md` §2, §3.1, §8, §11
- Skills: `new-component`
