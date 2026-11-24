import { describe, expect, it } from "vitest";
import type { ArticleStatus } from "./articleModel";
import { publishedPosts } from "./publishedPosts";

const post = (id: string, date: string, status: ArticleStatus = "publicado") => ({
  id,
  data: { date: new Date(date), status },
});
const NOW = new Date("2026-10-30");

describe("publishedPosts", () => {
  it("sorts newest first", () => {
    const result = publishedPosts([post("a", "2026-01-01"), post("b", "2026-06-01")], NOW);
    expect(result.map((item) => item.id)).toEqual(["b", "a"]);
  });

  it("publishes only `publicado` articles whose date has come", () => {
    const result = publishedPosts(
      [
        post("draft", "2026-01-01", "borrador"),
        post("reviewed", "2026-01-01", "revisado"),
        post("approved", "2026-01-01", "aprobado"),
        post("future", "2027-01-01"),
        post("ok", "2026-02-01"),
      ],
      NOW,
    );
    expect(result.map((item) => item.id)).toEqual(["ok"]);
  });
});
