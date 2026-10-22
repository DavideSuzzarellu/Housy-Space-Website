import { z } from "astro/zod";
import type { Agent } from "@/features/agency/domain/agent";
import {
  ENERGY_GRADES,
  OPERATIONS,
  PROPERTY_FEATURES,
  toAgentId,
  toAreaM2,
  toIsoDateTime,
  toPriceEUR,
  toPropertyRef,
  type Property,
} from "../../domain/property";

/**
 * Schemas of the content-layer entries (the mapped domain shapes, not raw Mobilia).
 * Transforms re-apply the domain brand constructors so `CollectionEntry` data is typed
 * with branded types; the assertions below fail the type check if they drift.
 */

const localizedText = z.object({
  es: z.string().optional(),
  en: z.string().optional(),
  it: z.string().optional(),
  ca: z.string().optional(),
});

const area = z.number().nonnegative().transform(toAreaM2);
const count = z.number().int().nonnegative();
const isoDateTime = z.string().transform(toIsoDateTime);

const price = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("amount"), amount: z.number().nonnegative().transform(toPriceEUR) }),
  z.object({ kind: z.literal("onRequest") }),
]);

const energyRating = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("grade"), grade: z.enum(ENERGY_GRADES) }),
  z.object({ kind: z.literal("pending") }),
  z.object({ kind: z.literal("exempt") }),
]);

/** Always the approximate zone (§5); unknown keys such as an address are stripped. */
const location = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radiusM: z.number().nonnegative(),
  zone: z.string().optional(),
  city: z.string().optional(),
});

export const propertySchema = z.object({
  ref: z.string().min(1).transform(toPropertyRef),
  operations: z.array(z.enum(OPERATIONS)),
  prices: z.object({
    sale: price.optional(),
    rent: price.optional(),
    transfer: price.optional(),
  }),
  status: z.enum(["available", "reserved"]),
  featured: z.boolean(),
  title: localizedText,
  summary: localizedText,
  description: localizedText,
  propertyType: localizedText,
  condition: localizedText,
  builtArea: area.optional(),
  usableArea: area.optional(),
  plotArea: area.optional(),
  terraceArea: area.optional(),
  gardenArea: area.optional(),
  bedrooms: count.optional(),
  bathrooms: count.optional(),
  toilets: count.optional(),
  yearBuilt: z.number().int().optional(),
  floor: z.string().optional(),
  energyRating: energyRating.optional(),
  emissionsRating: energyRating.optional(),
  features: z.array(z.enum(PROPERTY_FEATURES)),
  photos: z.array(z.object({ url: z.url({ protocol: /^https$/ }), caption: localizedText })),
  location: location.optional(),
  agentId: z.number().int().positive().transform(toAgentId).optional(),
  virtualTourUrl: z.url({ protocol: /^https$/ }).optional(),
  updatedAt: isoDateTime,
  listedAt: isoDateTime.optional(),
});

export const agentSchema = z.object({
  id: z.number().int().positive().transform(toAgentId),
  name: z.string().min(1),
  email: z.string().optional(),
});

/** Compile-time guards: the stored shapes must stay assignable to the domain types. */
type Assert<T extends true> = T;
export type PropertySchemaMatchesDomain = Assert<
  z.output<typeof propertySchema> extends Property ? true : false
>;
export type AgentSchemaMatchesDomain = Assert<
  z.output<typeof agentSchema> extends Agent ? true : false
>;
