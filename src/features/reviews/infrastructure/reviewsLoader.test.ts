import { describe, expect, it, vi } from "vitest";
import { fetchPlaceReviews, mapPlace, type FetchLike } from "./googlePlaces";
import { isCacheFresh, REVIEWS_CACHE_MS, reviewsLoader } from "./reviewsLoader";

const PLACE = {
  rating: 4.9,
  userRatingCount: 31,
  googleMapsUri: "https://maps.google.com/?cid=1",
  attributions: [{ provider: "Proveedor" }],
  reviews: [
    {
      rating: 5,
      publishTime: "2026-05-01T10:00:00Z",
      googleMapsUri: "https://maps.google.com/review/1",
      text: { text: "Traducido" },
      originalText: { text: "Original" },
      authorAttribution: {
        displayName: "Ana",
        uri: "https://maps.google.com/u/1",
        photoUri: "https://lh3.googleusercontent.com/a",
      },
    },
    { rating: 1, publishTime: "2026-04-01T10:00:00Z", text: { text: "Sin autor" } },
  ],
};

function fakeContext() {
  const entries = new Map<string, unknown>();
  const metaStore = new Map<string, string>();
  return {
    entries,
    metaStore,
    context: {
      store: {
        has: (id: string) => entries.has(id),
        set: (entry: { id: string; data: unknown }) => {
          entries.set(entry.id, entry.data);
          return true;
        },
      },
      meta: {
        get: (key: string) => metaStore.get(key),
        set: (key: string, value: string) => metaStore.set(key, value),
      },
      logger: { info: vi.fn(), warn: vi.fn() },
      parseData: ({ data }: { data: unknown }) => Promise.resolve(data),
      generateDigest: () => "digest",
    },
  };
}

const ok: FetchLike = () => Promise.resolve(new Response(JSON.stringify(PLACE)));

async function runLoad(loader: ReturnType<typeof reviewsLoader>, context: unknown): Promise<void> {
  // The fake implements only what this loader uses of Astro's LoaderContext.
  await Reflect.apply(loader.load, undefined, [context]);
}

describe("mapPlace", () => {
  it("uses the author's original text, never the translation", () => {
    expect(mapPlace(PLACE).reviews[0]?.text).toBe("Original");
  });

  it("keeps Google's order and the link to each review", () => {
    const [review] = mapPlace(PLACE).reviews;
    expect(review?.reviewUrl).toBe("https://maps.google.com/review/1");
    expect(review?.authorName).toBe("Ana");
  });

  it("drops a review without an author: it cannot be credited", () => {
    expect(mapPlace(PLACE).reviews).toHaveLength(1);
  });
});

describe("fetchPlaceReviews", () => {
  it("sends the key in a header, never in the URL", async () => {
    const fetcher = vi.fn(ok);
    await fetchPlaceReviews("SECRET", "place 1", fetcher);
    const [url, init] = fetcher.mock.calls[0] ?? [];
    expect(url).not.toContain("SECRET");
    expect(url).toContain("place%201");
    expect(init).toMatchObject({ headers: { "X-Goog-Api-Key": "SECRET" } });
  });

  it("reports Google's error code", async () => {
    const body = {
      error: { status: "PERMISSION_DENIED", details: [{ reason: "API_KEY_INVALID" }] },
    };
    const fetcher = () => Promise.resolve(new Response(JSON.stringify(body), { status: 403 }));
    await expect(fetchPlaceReviews("SECRET", "p", fetcher)).rejects.toThrow(
      "status 403 (PERMISSION_DENIED, API_KEY_INVALID)",
    );
  });

  it("does not leak the key when Google fails", async () => {
    const fetcher = () => Promise.resolve(new Response("{}", { status: 403 }));
    await expect(fetchPlaceReviews("SECRET", "p", fetcher)).rejects.toThrow(/status 403/);
    await expect(fetchPlaceReviews("SECRET", "p", fetcher)).rejects.not.toThrow(/SECRET/);
  });
});

describe("isCacheFresh", () => {
  it("is fresh within the window and stale after it", () => {
    expect(isCacheFresh("1000", 1000 + REVIEWS_CACHE_MS - 1)).toBe(true);
    expect(isCacheFresh("1000", 1000 + REVIEWS_CACHE_MS)).toBe(false);
    expect(isCacheFresh(undefined, 1000)).toBe(false);
  });
});

describe("reviewsLoader", () => {
  const options = { apiKey: "k", placeId: "p", now: () => 5000 };

  it("calls Google once and then serves the cached copy", async () => {
    const fetcher = vi.fn(ok);
    const fake = fakeContext();
    const loader = reviewsLoader({ ...options, fetcher });
    await runLoad(loader, fake.context);
    await runLoad(loader, fake.context);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fake.entries.has("google")).toBe(true);
  });

  it("refreshes after the cache expires", async () => {
    const fetcher = vi.fn(ok);
    const fake = fakeContext();
    await runLoad(reviewsLoader({ ...options, fetcher }), fake.context);
    await runLoad(
      reviewsLoader({ ...options, fetcher, now: () => 5000 + REVIEWS_CACHE_MS }),
      fake.context,
    );
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("keeps the last copy and does not fail when Google is down", async () => {
    const fake = fakeContext();
    await runLoad(reviewsLoader({ ...options, fetcher: ok }), fake.context);
    const down = () => Promise.resolve(new Response("{}", { status: 500 }));
    await runLoad(
      reviewsLoader({ ...options, fetcher: down, now: () => 5000 + REVIEWS_CACHE_MS }),
      fake.context,
    );
    expect(fake.entries.has("google")).toBe(true);
    expect(fake.context.logger.warn).toHaveBeenCalled();
  });

  it("makes no request without credentials", async () => {
    const fetcher = vi.fn(ok);
    const fake = fakeContext();
    await runLoad(reviewsLoader({ apiKey: undefined, placeId: "p", fetcher }), fake.context);
    expect(fetcher).not.toHaveBeenCalled();
  });
});
