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
/** One way to ask for a valuation: kicker tag, title, line and action label. */
const valuationOption = z.object({ tag: text, title: text, text, action: text }).strict();

export function homeContentSchema() {
  return z
    .object({
      hero: z
        .object({
          headingFirst: text,
          headingSecond: text,
          subFirst: text,
          subSecond: text,
          primaryCta: text,
          ctaLabel: text,
        })
        .strict(),
      // Fixed parts of the design are named fields, not lists: the CMS form cannot add a third
      // heading line or a fourth step that the layout has no room for (and that would fail the build).
      stats: z
        .object({
          heading,
          intro: text,
          stat1Number: z.number().int().nonnegative(),
          stat1Plus: z.boolean(),
          stat1Unit: text,
          stat1Label: text,
          stat2Number: z.number().int().nonnegative(),
          stat2Plus: z.boolean(),
          stat2Unit: text,
          stat2Label: text,
          stat3Number: z.number().int().nonnegative(),
          stat3Plus: z.boolean(),
          stat3Unit: text,
          stat3Label: text,
          stat4Number: z.number().int().nonnegative(),
          stat4Plus: z.boolean(),
          stat4Unit: text,
          stat4Label: text,
          note: text,
          ctaLabel: text,
        })
        .strict(),
      featured: z.object({ heading, ctaLabel: text }).strict(),
      valuation: z
        .object({
          kicker: text,
          heading,
          lead: text,
          online: valuationOption,
          advisor: valuationOption,
        })
        .strict(),
      services: z.object({ heading, ctaLabel: text }).strict(),
      philosophy: z
        .object({
          heading,
          lead: text,
          leadStrong: text,
          text,
          quote: text,
          ctaLabel: text,
        })
        .strict(),
      reviews: z.object({ heading: text, ctaLabel: text, mapsUrl: z.url() }).strict(),
      districts: z.object({ heading, sub: text, ctaLabel: text }).strict(),
      blog: z.object({ heading, ctaLabel: text }).strict(),
    })
    .strict();
}
