import { z } from "astro/zod";
import { hasBalancedEmphasis } from "@/shared/lib/emphasis";

/**
 * Editorial content of the home page (UI proposal v3), one JSON file per locale in
 * `src/content/home/`, edited by the client in Pages CMS (`.pages.yml`). Listings come from
 * Mobilia and UI labels from the i18n dictionaries; only editable copy and media live here.
 * Strict: a field Pages CMS writes that the site does not know is an error, never ignored.
 */

const text = z.string().trim().min(1);
/** Heading with an optional `*italic part*` (see shared/lib/emphasis.ts). */
const heading = text.refine(hasBalancedEmphasis, "Unclosed *emphasis* marker");
/** Video uploaded through the CMS media library to `public/media` (served as is). */
const video = z.string().regex(/^\/media\/[\w./-]+\.(mp4|webm)$/);

/**
 * `image` is Astro's `image()` from the collection schema context: images live in `src/assets`
 * so Astro optimizes them (AGENTS.md §8). Tests pass a stand-in.
 */
export function homeContentSchema<I extends z.ZodType>(image: () => I) {
  return z
    .object({
      hero: z
        .object({
          videoLandscape: video,
          videoPortrait: video,
          posterLandscape: image(),
          posterPortrait: image(),
        })
        .strict(),
      // Fixed parts of the design are named fields, not lists: the CMS form cannot add a third
      // heading line or a fourth step that the layout has no room for (and that would fail the build).
      presentation: z
        .object({
          eyebrow: text,
          headingFirst: text,
          headingSecond: text,
          linkLabel: text,
        })
        .strict(),
      featured: z.object({ heading, ctaLabel: text }).strict(),
      valuation: z
        .object({
          image: image(),
          imageAlt: text,
          heading,
          lead: text,
          ctaLabel: text,
        })
        .strict(),
      services: z.object({ heading }).strict(),
      collaborators: z.object({ text, ctaLabel: text }).strict(),
      philosophy: z
        .object({
          quoteFirst: text,
          quoteSecond: text,
          subLead: text,
          sub: text,
          primaryCta: text,
        })
        .strict(),
      reviews: z.object({ heading, ctaLabel: text, mapsUrl: z.url() }).strict(),
      districts: z.object({ heading, ctaLabel: text }).strict(),
      blog: z.object({ heading, ctaLabel: text }).strict(),
    })
    .strict();
}
