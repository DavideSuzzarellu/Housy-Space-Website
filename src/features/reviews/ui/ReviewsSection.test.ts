import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";
import ReviewsSection from "./ReviewsSection.astro";

const content = {
  heading: "Lo que dicen *de HousySpace*",
  ctaLabel: "Ver reseñas en Google",
  mapsUrl: "https://maps.app.goo.gl/test",
};

let container: AstroContainer;

beforeAll(async () => {
  container = await AstroContainer.create();
});

describe("ReviewsSection", () => {
  it("renders nothing without reviews (no empty stars, no fake reviews)", async () => {
    const html = await container.renderToString(ReviewsSection, {
      props: { locale: "es", content, testimonials: [] },
    });
    expect(html.trim()).toBe("");
  });

  it("renders author, rating, text, notice and the link to Google", async () => {
    const html = await container.renderToString(ReviewsSection, {
      props: {
        locale: "es",
        content,
        testimonials: [
          {
            author: "Test A.",
            rating: 5,
            text: "Texto de prueba",
            date: new Date("2026-08-01"),
            language: "es",
          },
        ],
      },
    });
    expect(html).toContain("Test A.");
    expect(html).toContain("Texto de prueba");
    expect(html).toContain('aria-label="5 / 5"');
    expect(html).toContain("https://maps.app.goo.gl/test");
    expect(html).toContain("más recientes");
  });
});
