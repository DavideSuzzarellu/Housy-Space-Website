import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";
import ReviewsSection from "./ReviewsSection.astro";

let container: AstroContainer;

beforeAll(async () => {
  container = await AstroContainer.create();
});

describe("ReviewsSection", () => {
  it("renders nothing without real Google data (no empty stars, no fake reviews)", async () => {
    const html = await container.renderToString(ReviewsSection, {
      props: {
        locale: "es",
        content: { heading: "Lo que dicen *de HousySpace*", ctaLabel: "Ver reseñas en Google" },
      },
    });
    expect(html.trim()).toBe("");
  });

  it("renders nothing when Google returns no reviews", async () => {
    const html = await container.renderToString(ReviewsSection, {
      props: {
        locale: "es",
        content: { heading: "Lo que dicen *de HousySpace*", ctaLabel: "Ver reseñas en Google" },
        summary: {
          rating: 4.8,
          totalCount: 0,
          reviews: [],
          mapsUrl: "https://maps.google.com/?cid=1",
          attributions: [],
        },
      },
    });
    expect(html.trim()).toBe("");
  });

  it("renders author, rating, text and the Google Maps link when data exists", async () => {
    const html = await container.renderToString(ReviewsSection, {
      props: {
        locale: "es",
        content: { heading: "Lo que dicen *de HousySpace*", ctaLabel: "Ver reseñas en Google" },
        summary: {
          rating: 4.8,
          totalCount: 12,
          mapsUrl: "https://maps.google.com/?cid=1",
          attributions: [],
          reviews: [
            {
              authorName: "Test Author",
              rating: 5,
              text: "Texto de prueba",
              publishTime: "2026-08-01T10:00:00Z",
            },
          ],
        },
      },
    });
    expect(html).toContain("Test Author");
    expect(html).toContain("Texto de prueba");
    expect(html).toContain('aria-label="5 / 5"');
    expect(html).toContain("https://maps.google.com/?cid=1");
    expect(html).toContain("ordenadas por Google");
  });
});
