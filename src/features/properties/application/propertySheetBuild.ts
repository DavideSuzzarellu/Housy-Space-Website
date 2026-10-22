/**
 * Contract between the property sheet source pages and `scripts/build-property-sheets.ts`,
 * which prints them to PDF after `astro build`. Imported by that plain Node script, so this
 * file must stay free of path aliases and Astro imports.
 */

/** `src/pages/{dir}/[locale]/[sheet].astro`: internal pages, removed from `dist` once printed. */
export const PROPERTY_SHEET_SOURCE_DIR = "property-sheet-source";

/** Public folder of the generated PDFs (`dist/{dir}/*.pdf`). Language-neutral on purpose. */
export const PROPERTY_SHEET_PDF_DIR = "pdf";

/** `<meta name>` on each source page whose `content` is the root-relative PDF path to write. */
export const PROPERTY_SHEET_PDF_META = "housyspace:sheet-pdf";

/** Only paths of this shape are written by the script (no traversal outside the PDF folder). */
export const PROPERTY_SHEET_PDF_PATH = new RegExp(
  `^/${PROPERTY_SHEET_PDF_DIR}/[a-z0-9]+(?:-[a-z0-9]+)*\\.pdf$`,
);
