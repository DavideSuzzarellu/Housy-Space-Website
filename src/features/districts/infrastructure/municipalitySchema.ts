import { z } from "astro/zod";

/**
 * Municipalities of the province of Barcelona (`src/content/municipalities`), taken from proposal
 * v3: official code, name, comarca and area published by the ICGC. Population and market figures
 * are not in this source and are shown as "not available" (AGENTS.md §6.2), never estimated.
 */
const text = z.string().trim().min(1);

export const municipalitySchema = z
  .object({
    /** 6-digit territorial code (INE 5 digits + control digit). */
    code: z.string().regex(/^\d{6}$/),
    name: text,
    /** Official Catalan name, ASCII-slugified (apostrophes dropped, as barrio slugs). */
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    comarca: text,
    areaKm2: z.number().positive(),
  })
  .strict();

export const municipalitiesSchema = z
  .object({
    source: z.object({ provider: text, url: z.url(), license: text }).strict(),
    municipalities: z.array(municipalitySchema).min(1),
  })
  .strict();

export type Municipality = z.infer<typeof municipalitySchema>;
export type MunicipalitiesData = z.infer<typeof municipalitiesSchema>;
