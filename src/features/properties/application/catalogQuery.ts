import { z } from "astro/zod";
import {
  CATALOG_SORTS,
  DEFAULT_CATALOG_FILTERS,
  type CatalogFilters,
  type CatalogSort,
  type MapBounds,
} from "../domain/catalog";
import { PROPERTY_FEATURES, type PropertyFeature } from "../domain/property";

/**
 * Catalog state ↔ URL query (AGENTS.md §4.1: filters live in shareable query params).
 * Params are parsed with Zod at the boundary (§8.1); each invalid value is dropped on its own
 * so a bad link still shows the rest of the search. Param names are the same in every locale.
 */

export const CATALOG_VIEWS = ["list", "split", "map"] as const;
export type CatalogView = (typeof CATALOG_VIEWS)[number];

export interface CatalogQuery {
  readonly filters: CatalogFilters;
  readonly view: CatalogView;
}

export const DEFAULT_CATALOG_QUERY: CatalogQuery = {
  filters: DEFAULT_CATALOG_FILTERS,
  view: "list",
};

/** Query param names, also the `name` of each filter form control. */
export const CATALOG_PARAMS = {
  zone: "zona",
  type: "tipo",
  priceMin: "pmin",
  priceMax: "pmax",
  areaMin: "smin",
  areaMax: "smax",
  bedrooms: "hab",
  bathrooms: "ban",
  features: "car",
  bounds: "mapa",
  sort: "orden",
  view: "vista",
} as const;

export const SORT_PARAM_VALUES = {
  recent: "recientes",
  priceAsc: "precio-asc",
  priceDesc: "precio-desc",
  area: "superficie",
} as const satisfies Record<CatalogSort, string>;

export const VIEW_PARAM_VALUES = {
  list: "lista",
  split: "mixta",
  map: "mapa",
} as const satisfies Record<CatalogView, string>;

const SORT_BY_PARAM = new Map<string, CatalogSort>(
  CATALOG_SORTS.map((sort) => [SORT_PARAM_VALUES[sort], sort]),
);
const VIEW_BY_PARAM = new Map<string, CatalogView>(
  CATALOG_VIEWS.map((view) => [VIEW_PARAM_VALUES[view], view]),
);

const slugParam = z
  .string()
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
/** Whole euros / m²: digits only, so `-5`, `1e3` or `abc` are rejected. */
const amountParam = z
  .string()
  .regex(/^\d{1,9}$/)
  .transform(Number);
const countParam = z
  .string()
  .regex(/^[1-9]\d?$/)
  .transform(Number);
const featureParam = z.enum(PROPERTY_FEATURES);
const degree = z
  .string()
  .regex(/^-?\d{1,3}(?:\.\d{1,9})?$/)
  .transform(Number);
/** `south,west,north,east`, a non-empty box inside valid latitude/longitude ranges. */
const boundsParam = z
  .string()
  .transform((value) => value.split(","))
  .pipe(z.tuple([degree, degree, degree, degree]))
  .transform(([south, west, north, east]): MapBounds => ({ south, west, north, east }))
  .refine(
    (box) =>
      box.south >= -90 &&
      box.north <= 90 &&
      box.west >= -180 &&
      box.east <= 180 &&
      box.south < box.north &&
      box.west < box.east,
  );
/** ~1 m precision: enough for a map viewport, keeps shared URLs short. */
const BOUNDS_DECIMALS = 5;
const sortParam = z
  .string()
  .transform((value) => SORT_BY_PARAM.get(value))
  .pipe(z.enum(CATALOG_SORTS));
const viewParam = z
  .string()
  .transform((value) => VIEW_BY_PARAM.get(value))
  .pipe(z.enum(CATALOG_VIEWS));

function read<T>(schema: z.ZodType<T, string>, value: string | null): T | undefined {
  if (value === null) return undefined;
  const result = schema.safeParse(value);
  return result.success ? result.data : undefined;
}

function readFeatures(params: URLSearchParams): PropertyFeature[] {
  const features = new Set<PropertyFeature>();
  for (const value of params.getAll(CATALOG_PARAMS.features).flatMap((raw) => raw.split(","))) {
    const feature = read(featureParam, value.trim());
    if (feature !== undefined) features.add(feature);
  }
  return [...features];
}

/** Accepts both the URL (`car=a,b`) and a submitted form (`car=a&car=b`). */
export function parseCatalogQuery(params: URLSearchParams): CatalogQuery {
  const get = (name: string) => params.get(name);
  return {
    filters: {
      zone: read(slugParam, get(CATALOG_PARAMS.zone)),
      type: read(slugParam, get(CATALOG_PARAMS.type)),
      priceMin: read(amountParam, get(CATALOG_PARAMS.priceMin)),
      priceMax: read(amountParam, get(CATALOG_PARAMS.priceMax)),
      areaMin: read(amountParam, get(CATALOG_PARAMS.areaMin)),
      areaMax: read(amountParam, get(CATALOG_PARAMS.areaMax)),
      bedrooms: read(countParam, get(CATALOG_PARAMS.bedrooms)),
      bathrooms: read(countParam, get(CATALOG_PARAMS.bathrooms)),
      features: readFeatures(params),
      bounds: read(boundsParam, get(CATALOG_PARAMS.bounds)),
      sort: read(sortParam, get(CATALOG_PARAMS.sort)) ?? DEFAULT_CATALOG_FILTERS.sort,
    },
    view: read(viewParam, get(CATALOG_PARAMS.view)) ?? DEFAULT_CATALOG_QUERY.view,
  };
}

/** Defaults are omitted, so the unfiltered listing keeps its clean canonical URL. */
export function serializeCatalogQuery(query: CatalogQuery): URLSearchParams {
  const { filters, view } = query;
  const params = new URLSearchParams();
  const set = (name: string, value: string | number | undefined) => {
    if (value !== undefined) params.set(name, String(value));
  };
  set(CATALOG_PARAMS.zone, filters.zone);
  set(CATALOG_PARAMS.type, filters.type);
  set(CATALOG_PARAMS.priceMin, filters.priceMin);
  set(CATALOG_PARAMS.priceMax, filters.priceMax);
  set(CATALOG_PARAMS.areaMin, filters.areaMin);
  set(CATALOG_PARAMS.areaMax, filters.areaMax);
  set(CATALOG_PARAMS.bedrooms, filters.bedrooms);
  set(CATALOG_PARAMS.bathrooms, filters.bathrooms);
  if (filters.features.length > 0) set(CATALOG_PARAMS.features, filters.features.join(","));
  if (filters.bounds !== undefined) {
    const { south, west, north, east } = filters.bounds;
    set(
      CATALOG_PARAMS.bounds,
      [south, west, north, east].map((value) => value.toFixed(BOUNDS_DECIMALS)).join(","),
    );
  }
  if (filters.sort !== DEFAULT_CATALOG_FILTERS.sort) {
    set(CATALOG_PARAMS.sort, SORT_PARAM_VALUES[filters.sort]);
  }
  if (view !== DEFAULT_CATALOG_QUERY.view) set(CATALOG_PARAMS.view, VIEW_PARAM_VALUES[view]);
  return params;
}
