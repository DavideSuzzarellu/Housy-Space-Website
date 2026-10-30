import { z } from "astro/zod";

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
    lead: z.string(),
    history: z.array(z.string()),
    summary: z.string(),
    landmarks: z.array(
      z.object({ name: z.string(), where: z.string(), text: z.string() }).strict(),
    ),
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

export type MarketData = z.infer<typeof marketSchema>;
export type MarketBarrio = MarketData["barrios"][number];
export type MarketDistrict = MarketData["districts"][number];
