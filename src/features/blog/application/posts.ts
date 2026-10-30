import { getCollection, type CollectionEntry } from "astro:content";
import { publishedPosts } from "@/features/blog/domain/publishedPosts";

export type BlogPost = CollectionEntry<"blog">;

export async function getPosts(): Promise<BlogPost[]> {
  return publishedPosts(await getCollection("blog"), new Date());
}
