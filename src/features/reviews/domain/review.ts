/**
 * Google reviews (AGENTS.md §6.1). Filled by a future `reviews` collection loader
 * (Places API, max 5 reviews). Never edited, translated, filtered or reordered.
 */
export interface Review {
  readonly authorName: string;
  readonly authorUrl?: string | undefined;
  /** 1–5 stars as returned by Google. */
  readonly rating: number;
  readonly text: string;
  /** Google's own human-readable date ("hace 2 meses"). */
  readonly relativePublishTime: string;
}

export interface ReviewsSummary {
  readonly rating: number;
  readonly totalCount: number;
  readonly reviews: readonly Review[];
  readonly mapsUrl: string;
  /** Attributions returned by the API; rendered as-is. */
  readonly attributions: readonly string[];
}
