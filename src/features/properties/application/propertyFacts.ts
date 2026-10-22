import { getDictionary } from "@/shared/i18n";
import type { Locale } from "@/shared/i18n/config";
import { formatMessage, formatNumber } from "@/shared/lib/format";
import {
  localize,
  type AreaM2,
  type DetailOperation,
  type EnergyRating,
  type Property,
} from "../domain/property";

export type KeyFactKey =
  | "builtArea"
  | "usableArea"
  | "plotArea"
  | "bedrooms"
  | "bathrooms"
  | "toilets"
  | "floor"
  | "lift"
  | "terrace"
  | "garden"
  | "parking"
  | "yearBuilt";

type KeyFactValue =
  | { readonly kind: "area"; readonly value: AreaM2 }
  | { readonly kind: "count"; readonly value: number }
  | { readonly kind: "text"; readonly value: string }
  | { readonly kind: "yes" };

export interface KeyFact {
  readonly key: KeyFactKey;
  readonly label: string;
  readonly value: string;
}

function positive(value: number | undefined): value is number {
  return value !== undefined && value > 0;
}

/**
 * Facts Mobilia actually provides, in display order. A missing value is never shown
 * as "no": absence only means unknown (§13, never invent data).
 */
function collectFacts(property: Property): [KeyFactKey, KeyFactValue][] {
  const facts: [KeyFactKey, KeyFactValue][] = [];
  const has = (feature: Property["features"][number]) => property.features.includes(feature);
  const area = (key: KeyFactKey, value: AreaM2 | undefined) => {
    if (positive(value)) facts.push([key, { kind: "area", value }]);
  };
  const count = (key: KeyFactKey, value: number | undefined) => {
    if (positive(value)) facts.push([key, { kind: "count", value }]);
  };

  area("builtArea", property.builtArea);
  area("usableArea", property.usableArea);
  area("plotArea", property.plotArea);
  count("bedrooms", property.bedrooms);
  count("bathrooms", property.bathrooms);
  count("toilets", property.toilets);
  if (property.floor !== undefined && property.floor.trim() !== "") {
    facts.push(["floor", { kind: "text", value: property.floor.trim() }]);
  }
  if (has("lift")) facts.push(["lift", { kind: "yes" }]);
  if (positive(property.terraceArea)) area("terrace", property.terraceArea);
  else if (has("terrace")) facts.push(["terrace", { kind: "yes" }]);
  if (positive(property.gardenArea)) area("garden", property.gardenArea);
  else if (has("garden")) facts.push(["garden", { kind: "yes" }]);
  if (has("parking")) facts.push(["parking", { kind: "yes" }]);
  if (property.yearBuilt !== undefined) {
    facts.push(["yearBuilt", { kind: "text", value: String(property.yearBuilt) }]);
  }
  return facts;
}

/** Key facts of the detail page, labelled and formatted for a locale. */
export function presentKeyFacts(property: Property, locale: Locale): KeyFact[] {
  const t = getDictionary(locale).property;
  return collectFacts(property).map(([key, fact]) => {
    const value =
      fact.kind === "area"
        ? `${formatNumber(fact.value, locale)} ${t.areaUnit}`
        : fact.kind === "count"
          ? formatNumber(fact.value, locale)
          : fact.kind === "text"
            ? fact.value
            : t.facts.yes;
    return { key, label: t.facts[key], value };
  });
}

/** Energy/emissions label: grade letter, "pending certification", "exempt" or "not available". */
export function presentEnergyRating(rating: EnergyRating | undefined, locale: Locale): string {
  const t = getDictionary(locale).property;
  if (rating === undefined) return t.detail.energyNotAvailable;
  if (rating.kind === "grade") return rating.grade;
  return rating.kind === "pending" ? t.energyPending : t.energyExempt;
}

/** Description paragraphs (blank-line separated), falling back to the summary. */
export function presentDescription(property: Property, locale: Locale): string[] {
  const text = localize(property.description, locale) ?? localize(property.summary, locale) ?? "";
  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph !== "");
}

/** "Ref. X · Operation · Type": the line under the title (detail page, sheet). */
export function presentMetaLine(
  property: Property,
  operation: DetailOperation,
  locale: Locale,
): string {
  const t = getDictionary(locale).property;
  return [
    formatMessage(t.reference, { ref: property.ref }),
    t.operations[operation],
    localize(property.propertyType, locale),
  ]
    .filter((part): part is string => part !== undefined)
    .join(" · ");
}

export interface PresentedPhoto {
  readonly src: string;
  readonly alt: string;
}

/** Photos with alt text: the localized caption, else "Photo of the property: title (n/N)". */
export function presentPhotos(property: Property, title: string, locale: Locale): PresentedPhoto[] {
  const t = getDictionary(locale).property;
  return property.photos.map((photo, index) => ({
    src: photo.url,
    alt:
      localize(photo.caption, locale) ??
      `${formatMessage(t.photoAlt, { title })} (${index + 1}/${property.photos.length})`,
  }));
}
