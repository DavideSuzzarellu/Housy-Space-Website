import type { Locale } from "@/shared/i18n/config";
import { slugify } from "@/shared/lib/slugify";
import type { DetailOperation, Property } from "../domain/property";
import { PROPERTY_SHEET_PDF_DIR } from "./propertySheetBuild";

/**
 * Property sheet (AGENTS.md §6 item 24): an A4 HTML page per property, operation and locale,
 * printed to a downloadable PDF at build time. One sheet per operation, like the detail URL.
 */

/** `{ref}-{operation}`: unique per sheet, shared by the source page and the PDF name. */
function sheetKey(property: Property, operation: DetailOperation): string {
  return `${slugify(property.ref)}-${operation}`;
}

/** Root-relative PDF URL: `/pdf/housyspace-{ref}-{operation}-{locale}.pdf`. */
export function getPropertySheetPdfPath(
  property: Property,
  operation: DetailOperation,
  locale: Locale,
): string {
  return `/${PROPERTY_SHEET_PDF_DIR}/housyspace-${sheetKey(property, operation)}-${locale}.pdf`;
}

/** Name the browser saves the download as (`download` attribute). */
export function getPropertySheetFileName(property: Property): string {
  return `HousySpace-${slugify(property.ref).toUpperCase()}.pdf`;
}

// A type alias (not an interface) so it satisfies Astro's indexable `Params`.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type PropertySheetRouteParams = {
  readonly locale: Locale;
  readonly sheet: string;
};

/** Params of `src/pages/property-sheet-source/[locale]/[sheet].astro`. */
export function getPropertySheetRouteParams(
  property: Property,
  operation: DetailOperation,
  locale: Locale,
): PropertySheetRouteParams {
  return { locale, sheet: sheetKey(property, operation) };
}

const SIDE_PHOTOS = 2;
const GALLERY_PHOTOS = 4;

export interface SheetPhotos<T> {
  readonly cover: T | undefined;
  readonly side: readonly T[];
  readonly gallery: readonly T[];
}

/** Mobilia order: cover first, two beside it on page 1, then up to four in the gallery. */
export function splitSheetPhotos<T>(photos: readonly T[]): SheetPhotos<T> {
  const [cover, ...rest] = photos;
  return {
    cover,
    side: rest.slice(0, SIDE_PHOTOS),
    gallery: rest.slice(SIDE_PHOTOS, SIDE_PHOTOS + GALLERY_PHOTOS),
  };
}
