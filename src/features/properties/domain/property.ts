import type { Locale } from "@/shared/i18n/config";
import type { Brand } from "@/shared/lib/brand";

/**
 * Property domain (AGENTS.md §3, §8.1). Pure: no Astro, no infrastructure, no Mobilia names.
 * Values are plain JSON so they can live in the content-layer data store.
 */

/** Mobilia `referencia`, lowercased: the ONLY lookup key (§4.1). */
export type PropertyRef = Brand<string, "PropertyRef">;
export type PriceEUR = Brand<number, "PriceEUR">;
export type AreaM2 = Brand<number, "AreaM2">;
export type AgentId = Brand<number, "AgentId">;
/** UTC ISO 8601 date-time string. */
export type IsoDateTime = Brand<string, "IsoDateTime">;

export const OPERATIONS = ["sale", "rent", "transfer"] as const;
export type Operation = (typeof OPERATIONS)[number];

/** Operations with a public listing and detail route (§4.1). Transfer has none yet. */
export const DETAIL_OPERATIONS = ["sale", "rent"] as const satisfies readonly Operation[];
export type DetailOperation = (typeof DETAIL_OPERATIONS)[number];

/** Text per locale; a locale is absent when Mobilia has no text for it. */
export type LocalizedText = Readonly<Partial<Record<Locale, string | undefined>>>;

export type Price =
  { readonly kind: "amount"; readonly amount: PriceEUR } | { readonly kind: "onRequest" };

export type PropertyStatus = "available" | "reserved";

export const ENERGY_GRADES = ["A", "B", "C", "D", "E", "F", "G"] as const;
export type EnergyGrade = (typeof ENERGY_GRADES)[number];

export type EnergyRating =
  | { readonly kind: "grade"; readonly grade: EnergyGrade }
  | { readonly kind: "pending" }
  | { readonly kind: "exempt" };

export const PROPERTY_FEATURES = [
  "lift",
  "airConditioning",
  "terrace",
  "garden",
  "communalPool",
  "privatePool",
  "parking",
  "storageRoom",
  "furnished",
  "exterior",
  "builtInWardrobes",
  "petsAllowed",
  "concierge",
] as const;
export type PropertyFeature = (typeof PROPERTY_FEATURES)[number];

export interface PropertyPhoto {
  readonly url: string;
  readonly caption: LocalizedText;
}

/**
 * Privacy (§5): ALWAYS an approximate zone (centre + radius), never the building.
 * There is deliberately no exact variant, so no map or markup can ever show it.
 */
export interface PropertyLocation {
  /** Approximate centre from `toApproximateCentre`, never Mobilia's raw coordinates. */
  readonly latitude: number;
  readonly longitude: number;
  readonly radiusM: number;
  readonly zone?: string | undefined;
  readonly city?: string | undefined;
}

// A type alias (not an interface) so it is assignable to the loader's `Record<string, unknown>`.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type Property = {
  readonly ref: PropertyRef;
  readonly operations: readonly Operation[];
  readonly prices: Readonly<Partial<Record<Operation, Price | undefined>>>;
  readonly status: PropertyStatus;
  /** Highlighted on the home page (Mobilia `portadaWeb`). */
  readonly featured: boolean;
  readonly title: LocalizedText;
  /** Short plain-text summary. */
  readonly summary: LocalizedText;
  /** Long plain-text description; paragraphs separated by blank lines. */
  readonly description: LocalizedText;
  readonly propertyType: LocalizedText;
  readonly condition: LocalizedText;
  readonly builtArea?: AreaM2 | undefined;
  readonly usableArea?: AreaM2 | undefined;
  readonly plotArea?: AreaM2 | undefined;
  readonly terraceArea?: AreaM2 | undefined;
  readonly gardenArea?: AreaM2 | undefined;
  readonly bedrooms?: number | undefined;
  readonly bathrooms?: number | undefined;
  readonly toilets?: number | undefined;
  readonly yearBuilt?: number | undefined;
  /** Floor label as published in Mobilia ("5", "Bajo"...). */
  readonly floor?: string | undefined;
  readonly energyRating?: EnergyRating | undefined;
  readonly emissionsRating?: EnergyRating | undefined;
  readonly features: readonly PropertyFeature[];
  /** Ordered for display; the first one is the cover. */
  readonly photos: readonly PropertyPhoto[];
  readonly location?: PropertyLocation | undefined;
  readonly agentId?: AgentId | undefined;
  readonly virtualTourUrl?: string | undefined;
  readonly updatedAt: IsoDateTime;
  readonly listedAt?: IsoDateTime | undefined;
};

/**
 * Approximate-centre grid (§5): ≈ 556 m (latitude) × ≈ 543 m (longitude at Barcelona) cells.
 * Mobilia's "zone" coordinates can be the building itself, so a circle centred on them would
 * point at the address. The centre is snapped to its cell centre instead: deterministic (it
 * cannot be averaged across builds) and shared by every point in the cell.
 */
const ZONE_GRID_DEG = { latitude: 0.005, longitude: 0.0065 } as const;

/** Largest distance from a property to its approximate centre (cell half-diagonal, rounded up). */
export const MAX_APPROXIMATE_OFFSET_M = 400;

const COORDINATE_DECIMALS = 1e6;

export function toApproximateCentre(point: {
  readonly latitude: number;
  readonly longitude: number;
}): { readonly latitude: number; readonly longitude: number } {
  const snap = (value: number, step: number): number =>
    Math.round((Math.floor(value / step) + 0.5) * step * COORDINATE_DECIMALS) / COORDINATE_DECIMALS;
  return {
    latitude: snap(point.latitude, ZONE_GRID_DEG.latitude),
    longitude: snap(point.longitude, ZONE_GRID_DEG.longitude),
  };
}

export function toPropertyRef(raw: string): PropertyRef {
  const ref = raw.trim().toLowerCase();
  if (ref === "") throw new RangeError("PropertyRef cannot be empty");
  return ref as PropertyRef; // Brand constructor: the only place this cast is allowed.
}

export function toPriceEUR(value: number): PriceEUR {
  if (!Number.isFinite(value) || value < 0) throw new RangeError("PriceEUR must be >= 0");
  return value as PriceEUR; // Brand constructor.
}

export function toAreaM2(value: number): AreaM2 {
  if (!Number.isFinite(value) || value < 0) throw new RangeError("AreaM2 must be >= 0");
  return value as AreaM2; // Brand constructor.
}

export function toAgentId(value: number): AgentId {
  if (!Number.isInteger(value) || value <= 0) throw new RangeError("AgentId must be > 0");
  return value as AgentId; // Brand constructor.
}

export function toIsoDateTime(value: string): IsoDateTime {
  const time = Date.parse(value);
  if (Number.isNaN(time)) throw new RangeError("Invalid date-time");
  return new Date(time).toISOString() as IsoDateTime; // Brand constructor.
}

const FALLBACK_LOCALES = ["es", "en"] as const satisfies readonly Locale[];

/** Requested locale → `es` → `en` (§4). */
export function localize(text: LocalizedText, locale: Locale): string | undefined {
  for (const candidate of [locale, ...FALLBACK_LOCALES]) {
    const value = text[candidate];
    if (value !== undefined && value.trim() !== "") return value;
  }
  return undefined;
}

/** Text before the first comma or period ("Piso en venta en Barcelona, con 80 m²…"). */
function leadClause(text: string): string {
  const [first = text] = text.split(/[,.](?:\s|$)/);
  return first.trim();
}

/**
 * Display title: the localized web title, else the lead clause of the summary
 * (Mobilia generates it per locale). Never invents text.
 */
export function getPropertyTitle(property: Property, locale: Locale): string | undefined {
  const title = localize(property.title, locale);
  if (title !== undefined) return title;
  const summary = localize(property.summary, locale);
  return summary === undefined ? undefined : leadClause(summary);
}

export function getPrimaryOperation(property: Property): Operation | undefined {
  return OPERATIONS.find((operation) => property.operations.includes(operation));
}

export function getListPrice(
  property: Property,
): { readonly operation: Operation; readonly price: Price } | undefined {
  const operation = getPrimaryOperation(property);
  if (operation === undefined) return undefined;
  const price = property.prices[operation];
  return price === undefined ? undefined : { operation, price };
}

/** Detail operations the property is listed for, in canonical order (sale first). */
export function getDetailOperations(property: Property): DetailOperation[] {
  return DETAIL_OPERATIONS.filter((operation) => property.operations.includes(operation));
}

export function getOperationPrice(property: Property, operation: Operation): Price | undefined {
  return property.operations.includes(operation) ? property.prices[operation] : undefined;
}

export function getCoverPhoto(property: Property): PropertyPhoto | undefined {
  return property.photos[0];
}

export function getLocationLabel(property: Property): string | undefined {
  const { location } = property;
  if (location === undefined) return undefined;
  const parts = [location.zone, location.city].filter(
    (part): part is string => part !== undefined && part !== "",
  );
  return parts.length > 0 ? parts.join(" · ") : undefined;
}

function byUpdatedDesc(a: Property, b: Property): number {
  return b.updatedAt.localeCompare(a.updatedAt);
}

/** Featured (`portadaWeb`) first by recency; if none is featured, the latest ones. */
export function selectFeatured(properties: readonly Property[], limit: number): Property[] {
  const featured = properties.filter((property) => property.featured);
  const pool = featured.length > 0 ? featured : properties;
  return [...pool].sort(byUpdatedDesc).slice(0, limit);
}
