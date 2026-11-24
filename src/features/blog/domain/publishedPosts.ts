import type { ArticleStatus } from "./articleModel";

/**
 * Articles the public can see, newest first. Only `publicado` goes live, and a future date stays
 * unpublished until the next rebuild: that is how scheduled publication works (no auto-publish).
 */
export function publishedPosts<
  T extends { readonly data: { readonly date: Date; readonly status: ArticleStatus } },
>(posts: readonly T[], now: Date): T[] {
  return posts
    .filter((post) => post.data.status === "publicado" && post.data.date.getTime() <= now.getTime())
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}
