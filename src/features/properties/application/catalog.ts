import { getDictionary } from "@/shared/i18n";
import type { Locale } from "@/shared/i18n/config";
import { formatPrice, formatMessage } from "@/shared/lib/format";
import {
  getCatalogTypeKey,
  getCatalogZoneKey,
  sortCatalog,
  toCatalogItem,
  type CatalogItem,
} from "../domain/catalog";
import {
  getOperationPrice,
  getPropertyTitle,
  localize,
  PROPERTY_FEATURES,
  type DetailOperation,
  type Property,
  type PropertyFeature,
} from "../domain/property";
import { getListingPath, getPropertyDetailPath } from "./propertyPaths";

/** Catalog page model (AGENTS.md §6 item 18): cards, filter options and the island payload. */

export interface CatalogOption<T extends string = string> {
  readonly value: T;
  readonly label: string;
}

// A type alias (not an interface) so it stays assignable to JSON value types.
export type CatalogEntry = CatalogItem & {
  readonly title: string;
  readonly priceLabel: string;
  readonly href: string;
};

export interface CatalogModel {
  /** Listings of the operation, in the default order (most recent first). */
  readonly properties: readonly Property[];
  /** Same order as `properties`. */
  readonly entries: readonly CatalogEntry[];
  readonly options: {
    readonly zones: readonly CatalogOption[];
    readonly types: readonly CatalogOption[];
    readonly features: readonly CatalogOption<PropertyFeature>[];
  };
}

function priceLabel(property: Property, operation: DetailOperation, locale: Locale): string {
  const t = getDictionary(locale).property;
  const price = getOperationPrice(property, operation);
  if (price?.kind !== "amount") return t.priceOnRequest;
  const formatted = formatPrice(price.amount, locale);
  return operation === "rent" ? `${formatted}${t.perMonth}` : formatted;
}

function toEntry(
  property: Property,
  item: CatalogItem,
  operation: DetailOperation,
  locale: Locale,
): CatalogEntry {
  return {
    ...item,
    title:
      getPropertyTitle(property, locale) ??
      formatMessage(getDictionary(locale).property.reference, { ref: property.ref }),
    priceLabel: priceLabel(property, operation, locale),
    href: getPropertyDetailPath(property, locale, operation) ?? getListingPath(operation, locale),
  };
}

/** Unique options by value, labelled for the locale, sorted alphabetically. */
function uniqueOptions(
  pairs: readonly (readonly [string | undefined, string | undefined])[],
  locale: Locale,
): CatalogOption[] {
  const byValue = new Map<string, string>();
  for (const [value, label] of pairs) {
    if (value !== undefined && label !== undefined && !byValue.has(value)) {
      byValue.set(value, label);
    }
  }
  return [...byValue]
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label, locale));
}

export function buildCatalog(
  all: readonly Property[],
  operation: DetailOperation,
  locale: Locale,
): CatalogModel {
  const ordered = sortCatalog(
    all
      .filter((property) => property.operations.includes(operation))
      .map((property) => ({ ...toCatalogItem(property, operation), property })),
    "recent",
  );
  const properties = ordered.map(({ property }) => property);

  const featureNames = getDictionary(locale).property.featureNames;
  const present = new Set(properties.flatMap((property) => property.features));
  return {
    properties,
    entries: ordered.map(({ property, ...item }) => toEntry(property, item, operation, locale)),
    options: {
      zones: uniqueOptions(
        properties.map((property) => [getCatalogZoneKey(property), property.location?.zone]),
        locale,
      ),
      types: uniqueOptions(
        properties.map((property) => [
          getCatalogTypeKey(property),
          localize(property.propertyType, locale),
        ]),
        locale,
      ),
      features: PROPERTY_FEATURES.filter((feature) => present.has(feature))
        .map((feature) => ({ value: feature, label: featureNames[feature] }))
        .sort((a, b) => a.label.localeCompare(b.label, locale)),
    },
  };
}
