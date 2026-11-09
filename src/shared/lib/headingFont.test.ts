import { describe, expect, it } from "vitest";
import { HEADING_FAMILY, HEADING_SIZE_ADJUST, headingFontFaceCss } from "./headingFont";

const LATIN = {
  src: [{ url: "/base/_astro/fonts/a.woff2", format: "woff2" }],
  weight: "100 900",
  style: "normal",
  subset: "latin",
};
const LATIN_EXT = {
  ...LATIN,
  src: [{ url: "/base/_astro/fonts/b.woff2", format: "woff2" }],
  subset: "latin-ext",
};

describe("headingFontFaceCss", () => {
  it("declares the heading family at 81.9% reusing the body font files", () => {
    const css = headingFontFaceCss([LATIN]);
    expect(css).toContain(`font-family:"${HEADING_FAMILY}"`);
    expect(css).toContain(`size-adjust:${HEADING_SIZE_ADJUST}`);
    expect(css).toContain('src:url("/base/_astro/fonts/a.woff2") format("woff2")');
    expect(css).toContain("font-weight:100 900");
  });

  it("emits one @font-face per file with the unicode-range of its subset", () => {
    const css = headingFontFaceCss([LATIN, LATIN_EXT]);
    expect(css.match(/@font-face/g)).toHaveLength(2);
    expect(css).toContain("unicode-range:U+0000-00FF");
    expect(css).toContain("unicode-range:U+0100-02BA");
  });

  it("omits unicode-range for an unknown subset and returns nothing for no fonts", () => {
    expect(headingFontFaceCss([{ ...LATIN, subset: "cyrillic" }])).not.toContain("unicode-range");
    expect(headingFontFaceCss([])).toBe("");
  });
});
