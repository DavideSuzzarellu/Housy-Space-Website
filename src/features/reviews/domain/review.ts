/**
 * Google reviews (AGENTS.md §6.1). Filled by the `reviews` collection loader
 * (Places API, max 5 reviews). Never edited, translated, filtered or reordered.
 */
export interface Review {
  readonly authorName: string;
  readonly authorUrl?: string | undefined;
  readonly authorPhotoUrl?: string | undefined;
  /** 1–5 stars as returned by Google. */
  readonly rating: number;
  readonly text: string;
  /** ISO date from Google, formatted per locale. */
  readonly publishTime: string;
  /** The review on Google Maps (required by Google's display policy). */
  readonly reviewUrl?: string | undefined;
}

export interface ReviewsSummary {
  readonly rating: number;
  readonly totalCount: number;
  readonly reviews: readonly Review[];
  readonly mapsUrl: string;
  /** Attributions returned by the API; rendered as-is. */
  readonly attributions: readonly string[];
}
