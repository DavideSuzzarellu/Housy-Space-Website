import type { Locale } from "@/shared/i18n/config";
import { getAlternates, getLocalizedPath, type Alternate } from "@/shared/i18n/routes";
import { slugify } from "@/shared/lib/slugify";
import {
  getDetailOperations,
  getPropertyTitle,
  localize,
  type DetailOperation,
  type Property,
} from "../domain/property";

/** `{slug}` max length (AGENTS.md §4.1). */
const SLUG_MAX_LENGTH = 60;
/** Last resort when Mobilia has neither title, summary nor type (never empty). */
const FALLBACK_SLUG = "property";

export function getPropertySlug(property: Property, locale: Locale): string {
  const candidates = [getPropertyTitle(property, locale), localize(property.propertyType, locale)];
  for (const candidate of candidates) {
    const slug = candidate === undefined ? "" : slugify(candidate, { maxLength: SLUG_MAX_LENGTH });
    if (slug !== "") return slug;
  }
  return FALLBACK_SLUG;
}

const DETAIL_ROUTE = { sale: "saleDetail", rent: "rentDetail" } as const satisfies Record<
  DetailOperation,
  string
>;

function detailParams(property: Property, locale: Locale) {
  return { slug: getPropertySlug(property, locale), ref: slugify(property.ref) };
}

/**
 * Canonical detail URL: one per operation (§4.1). Without an explicit operation, sale wins
 * when listed for both. Undefined when the property has no public listing for it
 * (transfer-only listings have no route yet).
 */
export function getPropertyDetailPath(
  property: Property,
  locale: Locale,
  operation?: DetailOperation,
): string | undefined {
  const target = operation ?? getDetailOperations(property)[0];
  if (target === undefined || !property.operations.includes(target)) return undefined;
  return getLocalizedPath(DETAIL_ROUTE[target], locale, detailParams(property, locale));
}

// A type alias (not an interface) so it satisfies Astro's indexable `Params`.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type DetailRouteParams = {
  readonly locale: Locale;
  /** Translated listing segment (`venta`, `rent`...). */
  readonly listing: string;
  /** `{slug}-{ref}`. */
  readonly detail: string;
};

/**
 * Params of `src/pages/[locale]/[listing]/[detail].astro`, derived from the route map
 * (never concatenated by hand) so pages and links can never disagree.
 */
export function getDetailRouteParams(
  property: Property,
  operation: DetailOperation,
  locale: Locale,
): DetailRouteParams {
  const path = getLocalizedPath(DETAIL_ROUTE[operation], locale, detailParams(property, locale));
  const [, prefix, listing, detail, ...rest] = path.split("/");
  if (prefix !== locale || listing === undefined || detail === undefined || rest.length > 0) {
    throw new RangeError(`Unexpected detail path shape: ${path}`);
  }
  return { locale, listing, detail };
}

const LISTING_ROUTE = { sale: "sale", rent: "rent" } as const satisfies Record<
  DetailOperation,
  string
>;

/** Catalog (listing) URL of an operation: `/es/venta`, `/en/rent`... */
export function getListingPath(operation: DetailOperation, locale: Locale): string {
  return getLocalizedPath(LISTING_ROUTE[operation], locale);
}

// A type alias (not an interface) so it satisfies Astro's indexable `Params`.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type ListingRouteParams = {
  readonly locale: Locale;
  /** Translated listing segment (`venta`, `rent`...). */
  readonly listing: string;
};

/** Params of `src/pages/[locale]/[listing]/index.astro`, derived from the route map. */
export function getListingRouteParams(
  operation: DetailOperation,
  locale: Locale,
): ListingRouteParams {
  const path = getListingPath(operation, locale);
  const [, prefix, listing, ...rest] = path.split("/");
  if (prefix !== locale || listing === undefined || rest.length > 0) {
    throw new RangeError(`Unexpected listing path shape: ${path}`);
  }
  return { locale, listing };
}

export function getListingAlternates(operation: DetailOperation): Alternate[] {
  return getAlternates(LISTING_ROUTE[operation]);
}

/** `hreflang` alternates of the same property/operation (localized slugs) + x-default. */
export function getPropertyAlternates(property: Property, operation: DetailOperation): Alternate[] {
  return getAlternates(DETAIL_ROUTE[operation], (locale) => detailParams(property, locale));
}
