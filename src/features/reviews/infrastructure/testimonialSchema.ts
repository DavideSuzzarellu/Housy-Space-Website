import { z } from "astro/zod";
import { LOCALES } from "@/shared/i18n/config";

/** One review per JSON file in `src/content/testimonials`, written by Pages CMS. */
export const testimonialSchema = z
  .object({
    author: z.string().trim().min(1),
    rating: z.number().int().min(1).max(5),
    text: z.string().trim().min(1),
    date: z.coerce.date(),
    language: z.enum(LOCALES),
  })
  .strict();
