import { z } from "astro/zod";
import type { CatalogEntry } from "./catalog";
import {
  PROPERTY_FEATURES,
  toAreaM2,
  toIsoDateTime,
  toPriceEUR,
  toPropertyRef,
} from "../domain/property";

/**
 * Client-side boundary of the catalog island (AGENTS.md §8.1): the JSON payload embedded in
 * the page is parsed before use. Kept apart from `catalog.ts` so the island never bundles the
 * i18n dictionaries. The assertion below fails the type check if it drifts from `CatalogEntry`.
 */

const count = z.number().int().nonnegative();

export const catalogEntrySchema = z.object({
  ref: z.string().min(1).transform(toPropertyRef),
  price: z.number().nonnegative().transform(toPriceEUR).optional(),
  area: z.number().nonnegative().transform(toAreaM2).optional(),
  bedrooms: count.optional(),
  bathrooms: count.optional(),
  typeKey: z.string().min(1).optional(),
  zoneKey: z.string().min(1).optional(),
  features: z.array(z.enum(PROPERTY_FEATURES)),
  updatedAt: z.string().transform(toIsoDateTime),
  title: z.string(),
  priceLabel: z.string(),
  /** Root-relative internal link only. */
  href: z.string().regex(/^\/[a-z]{2}\/[a-z0-9/-]+$/),
  /** Approximate zone only (§5). */
  location: z
    .object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      radiusM: z.number().nonnegative(),
    })
    .optional(),
});

export const catalogEntriesSchema = z.array(catalogEntrySchema);

type Assert<T extends true> = T;
export type CatalogEntrySchemaMatchesModel = Assert<
  z.output<typeof catalogEntrySchema> extends CatalogEntry ? true : false
>;
