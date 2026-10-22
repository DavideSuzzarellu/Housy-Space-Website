import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { makeProperty } from "../testing/makeProperty";
import {
  getPropertySheetFileName,
  getPropertySheetPdfPath,
  getPropertySheetRouteParams,
  splitSheetPhotos,
} from "./propertySheet";
import { PROPERTY_SHEET_PDF_DIR, PROPERTY_SHEET_SOURCE_DIR } from "./propertySheetBuild";

const property = makeProperty("DEMO-001", { operations: ["sale", "rent"] });
const photo = (n: number) => ({
  url: `https://media.mobiliagestion.es/Portals/${n}.jpg`,
  caption: {},
});

describe("property sheet paths", () => {
  it("serves one PDF per property, operation and locale under a language-neutral folder", () => {
    expect(getPropertySheetPdfPath(property, "sale", "es")).toBe(
      `/${PROPERTY_SHEET_PDF_DIR}/housyspace-demo-001-sale-es.pdf`,
    );
    expect(getPropertySheetPdfPath(property, "rent", "it")).toBe(
      `/${PROPERTY_SHEET_PDF_DIR}/housyspace-demo-001-rent-it.pdf`,
    );
  });

  it("names the downloaded file after the brand and the reference", () => {
    expect(getPropertySheetFileName(property)).toBe("HousySpace-DEMO-001.pdf");
  });

  it("builds the internal source page params from the same ref and operation", () => {
    expect(getPropertySheetRouteParams(property, "rent", "ca")).toEqual({
      locale: "ca",
      sheet: "demo-001-rent",
    });
  });

  it("keeps the source page folder in sync with the PDF build script", () => {
    expect(existsSync(`src/pages/${PROPERTY_SHEET_SOURCE_DIR}/[locale]/[sheet].astro`)).toBe(true);
  });
});

describe("splitSheetPhotos", () => {
  it("uses the first photo as cover, the next two beside it and up to four in the gallery", () => {
    const photos = Array.from({ length: 9 }, (_, index) => photo(index + 1));
    const split = splitSheetPhotos(photos);
    expect(split.cover?.url).toContain("/1.jpg");
    expect(split.side.map((item) => item.url)).toEqual([photos[1]?.url, photos[2]?.url]);
    expect(split.gallery.map((item) => item.url)).toEqual(
      photos.slice(3, 7).map((item) => item.url),
    );
  });

  it("never repeats a photo when there are only a few", () => {
    const split = splitSheetPhotos([photo(1), photo(2)]);
    expect(split.cover?.url).toContain("/1.jpg");
    expect(split.side).toHaveLength(1);
    expect(split.gallery).toEqual([]);
  });

  it("has no cover when Mobilia sends no photos", () => {
    expect(splitSheetPhotos([])).toEqual({ cover: undefined, side: [], gallery: [] });
  });
});
