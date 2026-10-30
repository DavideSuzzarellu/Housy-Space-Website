/**
 * Client reviews typed by hand in Pages CMS (AGENTS.md §6.1). Nothing comes from a Google API.
 * Text is copied word for word, never improved.
 */
export interface Testimonial {
  readonly author: string;
  /** 1–5 stars, as the client gave them. */
  readonly rating: number;
  readonly text: string;
  readonly date: Date;
  readonly language: string;
}

/** How many the home shows. */
export const LATEST_TESTIMONIALS = 3;

/** Newest first, limited to `limit`. */
export function latestTestimonials<T extends { readonly data: { readonly date: Date } }>(
  entries: readonly T[],
  limit: number,
): T[] {
  return [...entries].sort((a, b) => b.data.date.getTime() - a.data.date.getTime()).slice(0, limit);
}
