import { getCollection, type CollectionEntry } from "astro:content";
import { LATEST_TESTIMONIALS, latestTestimonials } from "@/features/reviews/domain/review";

export type TestimonialEntry = CollectionEntry<"testimonials">;

export async function getLatestTestimonials(): Promise<TestimonialEntry[]> {
  return latestTestimonials(await getCollection("testimonials"), LATEST_TESTIMONIALS);
}
