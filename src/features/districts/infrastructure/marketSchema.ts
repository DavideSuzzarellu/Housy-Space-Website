import { z } from "astro/zod";
import type { BarrioText, DistrictText } from "./zoneTextSchema";

/**
 * Official figures of Barcelona's districts and barrios (Portal de Dades, Open Data BCN, CartoBCN;
 * see the data sources page), from `src/content/market/barcelona.json`.
 */
const point = z.tuple([z.number(), z.number()]);
const provisional = z.object({ x: z.number(), y: z.number() }).strict();

const barrio = z
  .object({
    slug: z.string(),
    name: z.string(),
    district: z.string(),
    sale: z.number(),
    saleYear: z.number(),
    rent: z.number(),
    rentYear: z.number(),
    density: z.number(),
    densityYear: z.number(),
    population: z.number(),
    area: z.number(),
    rentPerM2: z.number(),
    income: z.number(),
    saleSeries: z.array(point),
    saleProvisional: provisional.nullable().optional(),
    rentSeries: z.array(point),
    rentProvisional: provisional.nullable().optional(),
  })
  .strict();

const district = z
  .object({
    slug: z.string(),
    name: z.string(),
    sale: z.number(),
    rent: z.number(),
    density: z.number(),
    population: z.number(),
    area: z.number(),
    barrioCount: z.number(),
    rentPerM2: z.number(),
    image: z.string(),
    saleSeries: z.array(point),
    rentSeries: z.array(point),
  })
  .strict();

export const marketSchema = z
  .object({
    city: z
      .object({
        name: z.string(),
        sale: z.number(),
        rent: z.number(),
        density: z.number(),
        saleSeries: z.array(point),
        rentSeries: z.array(point),
      })
      .strict(),
    districts: z.array(district),
    barrios: z.array(barrio),
  })
  .strict();

export type MarketNumbers = z.infer<typeof marketSchema>;

/** A district or barrio with its prose of the page locale (`marketText`) and whether it is the Spanish fallback. */
type Prose<Text extends { kind: string; translated: boolean }> = Omit<
  Text,
  "kind" | "translated"
> & {
  proseFallback: boolean;
};
export type MarketDistrict = MarketNumbers["districts"][number] & Prose<DistrictText>;
export type MarketBarrio = MarketNumbers["barrios"][number] & Prose<BarrioText>;
export type MarketData = Omit<MarketNumbers, "districts" | "barrios"> & {
  districts: MarketDistrict[];
  barrios: MarketBarrio[];
};
