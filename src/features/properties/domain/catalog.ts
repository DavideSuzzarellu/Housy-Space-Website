import { slugify } from "@/shared/lib/slugify";
import {
  getOperationPrice,
  localize,
  type AreaM2,
  type DetailOperation,
  type IsoDateTime,
  type PriceEUR,
  type Property,
  type PropertyFeature,
  type PropertyLocation,
  type PropertyRef,
} from "./property";

/**
 * Catalog search (AGENTS.md §6 item 18): pure filtering and sorting over a light projection
 * of each listing, shared by the server render and the client filter island.
 */

export const CATALOG_SORTS = ["recent", "priceAsc", "priceDesc", "area"] as const;
export type CatalogSort = (typeof CATALOG_SORTS)[number];

// A type alias (not an interface) so it stays assignable to JSON value types.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type CatalogItem = {
  readonly ref: PropertyRef;
  /** Public price of the listing's operation; absent when on request or unknown. */
  readonly price?: PriceEUR | undefined;
  readonly area?: AreaM2 | undefined;
  readonly bedrooms?: number | undefined;
  readonly bathrooms?: number | undefined;
  /** Slug of the property type (`pisos`), stable across locales. */
  readonly typeKey?: string | undefined;
  /** Slug of the zone name (`el-clot`). */
  readonly zoneKey?: string | undefined;
  /** Approximate zone only (§5): centre + radius, no zone/city text. */
  readonly location?: Pick<PropertyLocation, "latitude" | "longitude" | "radiusM"> | undefined;
  readonly features: readonly PropertyFeature[];
  readonly updatedAt: IsoDateTime;
};

/** Visible map area (degrees), "search in this area". */
export interface MapBounds {
  readonly south: number;
  readonly west: number;
  readonly north: number;
  readonly east: number;
}

export interface CatalogFilters {
  readonly zone?: string | undefined;
  readonly type?: string | undefined;
  readonly priceMin?: number | undefined;
  readonly priceMax?: number | undefined;
  readonly areaMin?: number | undefined;
  readonly areaMax?: number | undefined;
  /** Minimum number of bedrooms. */
  readonly bedrooms?: number | undefined;
  /** Minimum number of bathrooms. */
  readonly bathrooms?: number | undefined;
  /** Every listed feature is required. */
  readonly features: readonly PropertyFeature[];
  /** Only listings whose zone centre is inside this area. */
  readonly bounds?: MapBounds | undefined;
  readonly sort: CatalogSort;
}

export const DEFAULT_CATALOG_FILTERS: CatalogFilters = { features: [], sort: "recent" };

function slugKey(text: string | undefined): string | undefined {
  const key = text === undefined ? "" : slugify(text);
  return key === "" ? undefined : key;
}

/** Type key from the Spanish label (base Mobilia field), so it is the same in every locale. */
export function getCatalogTypeKey(property: Property): string | undefined {
  return slugKey(localize(property.propertyType, "es"));
}

export function getCatalogZoneKey(property: Property): string | undefined {
  return slugKey(property.location?.zone);
}

export function toCatalogItem(property: Property, operation: DetailOperation): CatalogItem {
  const price = getOperationPrice(property, operation);
  const { location } = property;
  return {
    ref: property.ref,
    price: price?.kind === "amount" ? price.amount : undefined,
    area: property.builtArea ?? property.usableArea,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    typeKey: getCatalogTypeKey(property),
    zoneKey: getCatalogZoneKey(property),
    location:
      location === undefined
        ? undefined
        : {
            latitude: location.latitude,
            longitude: location.longitude,
            radiusM: location.radiusM,
          },
    features: property.features,
    updatedAt: property.updatedAt,
  };
}

function inBounds(item: CatalogItem, bounds: MapBounds | undefined): boolean {
  if (bounds === undefined) return true;
  const { location } = item;
  return (
    location !== undefined &&
    location.latitude >= bounds.south &&
    location.latitude <= bounds.north &&
    location.longitude >= bounds.west &&
    location.longitude <= bounds.east
  );
}

/** Once a bound is set, an unknown value no longer matches (never assume it fits). */
function atLeast(value: number | undefined, min: number | undefined): boolean {
  return min === undefined || (value !== undefined && value >= min);
}

function atMost(value: number | undefined, max: number | undefined): boolean {
  return max === undefined || (value !== undefined && value <= max);
}

export function matchesCatalogFilters(item: CatalogItem, filters: CatalogFilters): boolean {
  return (
    (filters.zone === undefined || item.zoneKey === filters.zone) &&
    (filters.type === undefined || item.typeKey === filters.type) &&
    atLeast(item.price, filters.priceMin) &&
    atMost(item.price, filters.priceMax) &&
    atLeast(item.area, filters.areaMin) &&
    atMost(item.area, filters.areaMax) &&
    atLeast(item.bedrooms, filters.bedrooms) &&
    atLeast(item.bathrooms, filters.bathrooms) &&
    filters.features.every((feature) => item.features.includes(feature)) &&
    inBounds(item, filters.bounds)
  );
}

type Compare = (a: CatalogItem, b: CatalogItem) => number;

const byRecent: Compare = (a, b) =>
  b.updatedAt.localeCompare(a.updatedAt) || a.ref.localeCompare(b.ref);

/** Numeric order; listings without the value (e.g. price on request) always go last. */
function byNumber(pick: (item: CatalogItem) => number | undefined, direction: 1 | -1): Compare {
  return (a, b) => {
    const x = pick(a);
    const y = pick(b);
    if (x === undefined || y === undefined) {
      return x === y ? byRecent(a, b) : x === undefined ? 1 : -1;
    }
    return (x - y) * direction || byRecent(a, b);
  };
}

const COMPARE = {
  recent: byRecent,
  priceAsc: byNumber((item) => item.price, 1),
  priceDesc: byNumber((item) => item.price, -1),
  area: byNumber((item) => item.area, -1),
} as const satisfies Record<CatalogSort, Compare>;

export function sortCatalog<T extends CatalogItem>(items: readonly T[], sort: CatalogSort): T[] {
  return [...items].sort(COMPARE[sort]);
}

export function filterCatalog<T extends CatalogItem>(
  items: readonly T[],
  filters: CatalogFilters,
): T[] {
  return sortCatalog(
    items.filter((item) => matchesCatalogFilters(item, filters)),
    filters.sort,
  );
}
