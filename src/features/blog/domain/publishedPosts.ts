/** Articles the public can see, newest first. A future date stays unpublished until a rebuild. */
export function publishedPosts<
  T extends { readonly data: { readonly date: Date; readonly draft: boolean } },
>(posts: readonly T[], now: Date): T[] {
  return posts
    .filter((post) => !post.data.draft && post.data.date.getTime() <= now.getTime())
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}
