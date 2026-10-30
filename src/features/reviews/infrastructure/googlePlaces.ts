import { z } from "astro/zod";
import type { ReviewsSummary } from "@/features/reviews/domain/review";

/**
 * Google Places API (New) adapter (AGENTS.md §6.1). Server-side only; the key goes in a header and
 * is never logged. Mapping keeps Google's order and every review it returns.
 */
const PLACES_URL = "https://places.googleapis.com/v1/places/";
const FIELD_MASK = "rating,userRatingCount,reviews,googleMapsUri,attributions";

const localizedText = z.object({ text: z.string() });

const placeSchema = z.object({
  rating: z.number().optional(),
  userRatingCount: z.number().optional(),
  googleMapsUri: z.url().optional(),
  attributions: z.array(z.object({ provider: z.string().optional() })).optional(),
  reviews: z
    .array(
      z.object({
        rating: z.number(),
        publishTime: z.string(),
        googleMapsUri: z.url().optional(),
        // `originalText` is what the author wrote: reviews are never shown translated.
        originalText: localizedText.optional(),
        text: localizedText.optional(),
        authorAttribution: z
          .object({
            displayName: z.string(),
            uri: z.url().optional(),
            photoUri: z.url().optional(),
          })
          .optional(),
      }),
    )
    .optional(),
});

export function mapPlace(raw: unknown): ReviewsSummary {
  const place = placeSchema.parse(raw);
  return {
    rating: place.rating ?? 0,
    totalCount: place.userRatingCount ?? 0,
    mapsUrl: place.googleMapsUri ?? "",
    attributions: (place.attributions ?? []).flatMap((item) =>
      item.provider === undefined ? [] : [item.provider],
    ),
    reviews: (place.reviews ?? []).flatMap((review) => {
      const text = review.originalText?.text ?? review.text?.text;
      const author = review.authorAttribution;
      // Google requires crediting the author: a review without one cannot be displayed.
      if (text === undefined || author === undefined) return [];
      return [
        {
          authorName: author.displayName,
          authorUrl: author.uri,
          authorPhotoUrl: author.photoUri,
          rating: review.rating,
          text,
          publishTime: review.publishTime,
          reviewUrl: review.googleMapsUri,
        },
      ];
    }),
  };
}

const errorSchema = z.object({
  error: z.object({
    status: z.string().optional(),
    details: z.array(z.object({ reason: z.string().optional() })).optional(),
  }),
});

/** Google's error codes only (e.g. API_KEY_INVALID): its free-text message is not logged. */
async function errorReason(response: Response): Promise<string> {
  const parsed = errorSchema.safeParse(await response.json().catch(() => undefined));
  if (!parsed.success) return "";
  const codes = [
    parsed.data.error.status,
    ...(parsed.data.error.details ?? []).map((d) => d.reason),
  ];
  const known = codes.filter((code) => code !== undefined);
  return known.length > 0 ? ` (${known.join(", ")})` : "";
}

export type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

export async function fetchPlaceReviews(
  apiKey: string,
  placeId: string,
  fetcher: FetchLike = fetch,
): Promise<ReviewsSummary> {
  const response = await fetcher(`${PLACES_URL}${encodeURIComponent(placeId)}`, {
    headers: { "X-Goog-Api-Key": apiKey, "X-Goog-FieldMask": FIELD_MASK },
  });
  if (!response.ok) {
    const reason = await errorReason(response);
    throw new Error(`Places API responded with status ${response.status}${reason}`);
  }
  return mapPlace(await response.json());
}
