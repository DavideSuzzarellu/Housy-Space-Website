import type { Loader } from "astro/loaders";
import { z } from "astro/zod";
import { fetchPlaceReviews, type FetchLike } from "./googlePlaces";

/**
 * `reviews` collection: one entry with the place's Google reviews. Only calls Google when the
 * stored copy is older than `REVIEWS_CACHE_MS`, however many builds run in between.
 *
 * Google's policies restrict storing Places content; this cache was requested by the client and
 * its review before launch is tracked in ROADMAP (I24). This loader is the only place to change.
 */
export const REVIEWS_CACHE_MS = 24 * 60 * 60 * 1000;
const ENTRY_ID = "google";
const FETCHED_AT = "fetchedAt";

export const reviewsSchema = z.object({
  rating: z.number(),
  totalCount: z.number(),
  mapsUrl: z.string(),
  attributions: z.array(z.string()),
  reviews: z.array(
    z.object({
      authorName: z.string(),
      authorUrl: z.string().optional(),
      authorPhotoUrl: z.string().optional(),
      rating: z.number(),
      text: z.string(),
      publishTime: z.string(),
      reviewUrl: z.string().optional(),
    }),
  ),
});

export function isCacheFresh(fetchedAt: string | undefined, now: number): boolean {
  if (fetchedAt === undefined) return false;
  const age = now - Number(fetchedAt);
  return age >= 0 && age < REVIEWS_CACHE_MS;
}

interface Options {
  readonly apiKey: string | undefined;
  readonly placeId: string | undefined;
  readonly fetcher?: FetchLike;
  readonly now?: () => number;
}

export function reviewsLoader({ apiKey, placeId, fetcher, now = Date.now }: Options): Loader {
  return {
    name: "google-reviews",
    schema: reviewsSchema,
    load: async ({ store, meta, logger, parseData, generateDigest }) => {
      if (apiKey === undefined || placeId === undefined) {
        logger.warn("Google reviews not configured: the section stays hidden");
        return;
      }
      if (store.has(ENTRY_ID) && isCacheFresh(meta.get(FETCHED_AT), now())) {
        logger.info("Google reviews: cached copy still fresh, no request");
        return;
      }
      try {
        const summary = await fetchPlaceReviews(apiKey, placeId, fetcher);
        const data = await parseData({ id: ENTRY_ID, data: { ...summary } });
        store.set({ id: ENTRY_ID, data, digest: generateDigest(data) });
        meta.set(FETCHED_AT, String(now()));
        logger.info(`Google reviews sync: ${summary.reviews.length} stored`);
      } catch (error) {
        // Never fail the build for reviews: keep the last copy or hide the section (§6.1).
        const reason = error instanceof Error ? error.message : "unknown error";
        logger.warn(`Google reviews not updated: ${reason}`);
      }
    },
  };
}
