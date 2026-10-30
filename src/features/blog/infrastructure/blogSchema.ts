import { z } from "astro/zod";
import { LOCALES } from "@/shared/i18n/config";

export const BLOG_CATEGORIES = [
  "Actualidad y normativa",
  "Consejos",
  "Mercado",
  "Reformas y arquitectura",
  "Barrios",
] as const;

const text = z.string().trim().min(1);

/**
 * Frontmatter of a blog article (`src/content/blog/{slug}.md`), written by Pages CMS. Strict, so
 * a field the form adds without the site knowing it fails the build. Tests pass a stand-in `image`.
 */
export function blogSchema<I extends z.ZodType>(image: () => I) {
  return z
    .object({
      title: text,
      description: text,
      date: z.coerce.date(),
      category: z.enum(BLOG_CATEGORIES),
      language: z.enum(LOCALES),
      image: image(),
      imageAlt: text,
      draft: z.boolean().default(false),
    })
    .strict();
}
