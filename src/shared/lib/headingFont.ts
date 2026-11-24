import type { fontData } from "astro:assets";

/** One font file of the Fonts API (`astro/assets` does not export this type in Astro 7.4). */
type FontData = (typeof fontData)[keyof typeof fontData][number];

/** Same Montserrat files as the body, drawn at 81.9% (the reference site's heading scale, AGENTS.md §11.3). */
export const HEADING_FAMILY = "Montserrat Titulares";
export const HEADING_SIZE_ADJUST = "81.9%";

// Same ranges as the reference site's own @font-face (Google Fonts latin / latin-ext).
const UNICODE_RANGE: Readonly<Record<string, string>> = {
  latin:
    "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD",
  "latin-ext":
    "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C4,U+2113,U+2C60-2C7F,U+A720-A7FF",
};

/**
 * `@font-face` rules for the heading family, built from the body font's own files (`fontData`):
 * the Fonts API cannot set `size-adjust`, and reusing the URLs avoids a second download.
 */
export function headingFontFaceCss(fonts: readonly FontData[]): string {
  return fonts
    .map((font) => {
      const src = font.src
        .map(
          ({ url, format }) => `url("${url}")${format === undefined ? "" : ` format("${format}")`}`,
        )
        .join(",");
      const range = font.subset === undefined ? undefined : UNICODE_RANGE[font.subset];
      return (
        [
          `@font-face{font-family:"${HEADING_FAMILY}"`,
          `src:${src}`,
          "font-display:swap",
          `size-adjust:${HEADING_SIZE_ADJUST}`,
          `font-weight:${font.weight ?? "400 900"}`,
          `font-style:${font.style ?? "normal"}`,
          ...(range === undefined ? [] : [`unicode-range:${range}`]),
        ].join(";") + "}"
      );
    })
    .join("\n");
}
