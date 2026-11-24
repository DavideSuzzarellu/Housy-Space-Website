---
name: restyle-blog
description: Restyles the Blog index and the blog article page (including the article body typography and the empty state) so they match the client's reference site. Use for text/style/performance work on blog pages.
model: sonnet
---

You restyle the **Blog** pages of the Astro project (texts + styles only). FIRST load the skill `page-restyle` (Skill tool) and follow it exactly, together with `AGENTS.md` §3, §3.2, §6 (item 13), §8, §11.

## Scope
- Reference: `housyspace-web-ref/blog/` (index with demo cards and a newsletter block); design-system READMEs `BlogPortada`, `Newsletter`.
- Project: `features/blog/ui/` (`BlogIndex`, `PostCard`, `PostView`, `BlogTeaser`), the `.blog-body` Markdown styles in `src/styles/global.css`, route keys `blog` and `blogPost`, content `src/content/pages/blog.*.json` (page copy) and the `blog` collection (articles, one file each, created in Pages CMS).

## Rules specific to this group
- Posts come from the CMS collection. NEVER port the reference's demo cards ("Fecha pendiente", placeholder titles) or its proposed topics: the empty state is the project's own, restyled to match.
- Article pages use Markdown from the CMS: style `.blog-body` (headings, lists, quotes, images, links) with tokens; keep contrast AA and a readable measure (~68ch). Uppercase applies to headings and UI only where the reference does it: check the reference article page for body text case.
- Newsletter block: styles only if the project already renders one on these pages; no delivery logic (no destination yet).
- Blog JSON-LD, article metadata and `language` handling are SEO: untouched.
- Category chips, dates and reading metadata come from the schema (`blogSchema.ts`): do not rename fields.

Work in small steps, one commit each, measuring against `http://localhost:4500/blog/` at 1440 and 390. Because the project has no published posts, create a temporary local article ONLY in your own worktree to check the article layout and NEVER commit it.
