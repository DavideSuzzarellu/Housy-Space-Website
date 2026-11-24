import { describe, expect, it } from "vitest";
import { isIndexableArticleUrl } from "./articleUrls";

const LANGUAGES = new Map([
  ["cuanto-vale-mi-piso", "es"],
  ["how-much-is-my-flat", "en"],
]);

describe("isIndexableArticleUrl", () => {
  it("keeps an article only under the locale of its own language", () => {
    expect(isIndexableArticleUrl("/es/blog/cuanto-vale-mi-piso", LANGUAGES)).toBe(true);
    expect(isIndexableArticleUrl("/en/blog/cuanto-vale-mi-piso", LANGUAGES)).toBe(false);
    expect(isIndexableArticleUrl("/ca/blog/cuanto-vale-mi-piso", LANGUAGES)).toBe(false);
    expect(isIndexableArticleUrl("/en/blog/how-much-is-my-flat", LANGUAGES)).toBe(true);
  });

  it("works under a hosting base path and ignores every other URL", () => {
    expect(isIndexableArticleUrl("/repo/it/blog/cuanto-vale-mi-piso", LANGUAGES)).toBe(false);
    expect(isIndexableArticleUrl("/repo/es/blog/cuanto-vale-mi-piso", LANGUAGES)).toBe(true);
    expect(isIndexableArticleUrl("/es/blog", LANGUAGES)).toBe(true);
    expect(isIndexableArticleUrl("/es/vender", LANGUAGES)).toBe(true);
  });
});
