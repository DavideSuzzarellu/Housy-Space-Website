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
/**
 * `image` is Astro's `image()` from the collection schema context: images live in `src/assets`
 * so Astro optimizes them (AGENTS.md §8). Tests pass a stand-in.
 */
export function homeContentSchema<I extends z.ZodType>(image: () => I) {
  return z
    .object({
      hero: z
        .object({
          eyebrow: text,
          headingFirst: text,
          headingSecond: text,
          ctaLabel: text,
        })
        .strict(),
      // Fixed parts of the design are named fields, not lists: the CMS form cannot add a third
      // heading line or a fourth step that the layout has no room for (and that would fail the build).
      stats: z
        .object({
          eyebrow: text,
          heading,
          stat1Value: text,
          stat1Label: text,
          stat2Value: text,
          stat2Label: text,
          stat3Value: text,
          stat3Label: text,
          stat4Value: text,
          stat4Label: text,
          note: text,
          ctaLabel: text,
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
      gallery: z
        .object({
          heading: text,
          lead: text,
          item1Title: text,
          item1Subtitle: text,
          item2Title: text,
          item2Subtitle: text,
          item3Title: text,
          item3Subtitle: text,
          item4Title: text,
          item4Subtitle: text,
        })
        .strict(),
      collaborators: z
        .object({
          heading: text,
          card1Heading: text,
          card1Text: text,
          card1CtaLabel: text,
          card2Heading: text,
          card2Text: text,
          card2CtaLabel: text,
          note: text,
        })
        .strict(),
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
      contact: z
        .object({
          heading,
          lead: text,
          fieldNameLabel: text,
          fieldEmailLabel: text,
          fieldMessageLabel: text,
          fieldConsentLabel: text,
          submitLabel: text,
        })
        .strict(),
    })
    .strict();
}
