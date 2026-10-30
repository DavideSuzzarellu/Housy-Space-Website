import { getEntry } from "astro:content";
import type { ReviewsSummary } from "@/features/reviews/domain/review";

/** The place's Google reviews, or undefined when none are available (the section hides, §6.1). */
export async function getReviewsSummary(): Promise<ReviewsSummary | undefined> {
  const entry = await getEntry("reviews", "google");
  return entry?.data;
}
