import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";
import {
  toAreaM2,
  toIsoDateTime,
  toPriceEUR,
  toPropertyRef,
  type Property,
} from "../domain/property";
import PropertyCard from "./PropertyCard.astro";

const base: Property = {
  ref: toPropertyRef("1001"),
  operations: ["sale"],
  prices: { sale: { kind: "amount", amount: toPriceEUR(339000) } },
  status: "available",
  featured: true,
  title: {},
  summary: { es: "Piso en venta en Barcelona, con 80 m²." },
  description: {},
  propertyType: { es: "Pisos" },
  condition: {},
  builtArea: toAreaM2(80),
  bedrooms: 3,
  bathrooms: 1,
  energyRating: { kind: "grade", grade: "E" },
  features: [],
  photos: [],
  location: {
    latitude: 41.41,
    longitude: 2.19,
    radiusM: 250,
    zone: "El Clot",
    city: "Barcelona",
  },
  updatedAt: toIsoDateTime("2026-10-20T10:00:00Z"),
};

let container: AstroContainer;

beforeAll(async () => {
  container = await AstroContainer.create();
});

async function render(
  property: Property,
  locale: "es" | "en" = "es",
  priority = false,
): Promise<string> {
  const html = await container.renderToString(PropertyCard, {
    props: { property, locale, ctaLabel: "Consultar la ficha completa", priority },
  });
  return html.replace(/[\u00a0\u202f]/g, " ");
}

describe("PropertyCard", () => {
  it("renders title, zone, price, facts, energy rating and the detail link", async () => {
    const html = await render(base);
    expect(html).toContain("Piso en venta en Barcelona");
    expect(html).toContain("El Clot · Barcelona");
    expect(html).toContain("339.000 €");
    expect(html).toMatch(/<b[^>]*>80<\/b> m²/);
    expect(html).toMatch(/<b[^>]*>1<\/b> baño</);
    expect(html).toContain("Certificado energético");
    expect(html).toContain('href="/es/venta/piso-en-venta-en-barcelona-1001"');
    expect(html).toContain(">Venta<");
  });

  it("marks image, title and price as shared-element transition scopes", async () => {
    // Astro emits the names (from propertyTransitionName) as scoped CSS; values are
    // asserted in the Playwright suite via the computed `view-transition-name`.
    const html = await render(base);
    expect(html.match(/data-astro-transition-scope=/g)).toHaveLength(3);
  });

  it("shows price on request and the reserved badge", async () => {
    const html = await render({
      ...base,
      status: "reserved",
      prices: { sale: { kind: "onRequest" } },
    });
    expect(html).toContain("Precio a consultar");
    expect(html).toContain("Reservado");
    expect(html).not.toContain("339.000");
  });

  it("formats rentals per month and links to the rent detail route", async () => {
    const html = await render(
      {
        ...base,
        operations: ["rent"],
        prices: { rent: { kind: "amount", amount: toPriceEUR(900) } },
      },
      "en",
    );
    expect(html).toContain("€900");
    expect(html).toContain("/month");
    expect(html).toContain('href="/en/rent/piso-en-venta-en-barcelona-1001"');
  });

  it("prefetches the detail page when the card scrolls into view (mobile has no hover)", async () => {
    const html = await render(base);
    expect(html).toMatch(/<a[^>]*data-astro-prefetch="viewport"/);
  });

  describe("photo", () => {
    const withPhoto: Property = {
      ...base,
      photos: [{ url: "https://media.mobiliagestion.es/Portals/x/1.jpg", caption: {} }],
    };

    it("serves AVIF with a WebP fallback, lazy and async-decoded by default", async () => {
      const html = await render(withPhoto);
      expect(html).toMatch(/<source[^>]*type="image\/avif"/);
      expect(html).toMatch(/<img[^>]*loading="lazy"/);
      expect(html).toMatch(/<img[^>]*decoding="async"/);
      expect(html).not.toContain('fetchpriority="high"');
    });

    it("loads eagerly with high fetch priority when it is the LCP card", async () => {
      const html = await render(withPhoto, "es", true);
      expect(html).toMatch(/<img[^>]*loading="eager"/);
      expect(html).toMatch(/<img[^>]*fetchpriority="high"/);
    });
  });
});
