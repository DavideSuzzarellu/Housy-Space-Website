import { describe, expect, it } from "vitest";
import { PHOTO_PICTURE } from "./images";

describe("PHOTO_PICTURE", () => {
  it("serves AVIF first with a WebP fallback image", () => {
    expect(PHOTO_PICTURE.formats).toEqual(["avif"]);
    expect(PHOTO_PICTURE.fallbackFormat).toBe("webp");
  });

  it("keeps the <picture> wrapper out of layout so <img> sizing classes still apply", () => {
    expect(PHOTO_PICTURE.pictureAttributes.class).toBe("contents");
  });
});
