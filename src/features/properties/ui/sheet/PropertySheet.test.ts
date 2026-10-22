import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";
import { toAreaM2 } from "../../domain/property";
import { amount, approximateIn, makeProperty } from "../../testing/makeProperty";
import PropertySheet from "./PropertySheet.astro";

const SITE = new URL("https://www.housyspace.com");
const photo = (n: number) => ({
  url: `https://media.mobiliagestion.es/Portals/0/${n}.jpg`,
  caption: {},
});

const property = makeProperty("DEMO-001", {
  operations: ["sale"],
  prices: { sale: amount(1250000) },
  title: { es: "Piso señorial con balcón" },
  description: { es: "Primer párrafo.\n\nSegundo párrafo." },
  propertyType: { es: "Piso" },
  builtArea: toAreaM2(148),
  bedrooms: 3,
  bathrooms: 2,
  yearBuilt: 1910,
  energyRating: { kind: "grade", grade: "D" },
  features: ["lift", "exterior"],
  photos: Array.from({ length: 5 }, (_, index) => photo(index + 1)),
  location: approximateIn("La Dreta de l'Eixample"),
});

let container: AstroContainer;

beforeAll(async () => {
  container = await AstroContainer.create();
});

async function render(overrides = property, operation: "sale" | "rent" = "sale"): Promise<string> {
  return container.renderToString(PropertySheet, {
    props: { locale: "es", property: overrides, operation, site: SITE },
  });
}

describe("PropertySheet", () => {
  it("shows the real Mobilia data: reference, title, zone, price, facts and description", async () => {
    const html = await render();
    expect(html).toContain("Ref. demo-001");
    expect(html).toContain("Piso señorial con balcón");
    expect(html).toContain("La Dreta de l&#39;Eixample");
    expect(html).toMatch(/1\.250\.000\s€/);
    expect(html).toContain("148 m²");
    expect(html).toContain("Dormitorios");
    expect(html).toContain("<p>Primer párrafo.</p>");
    expect(html).toContain("<p>Segundo párrafo.</p>");
    expect(html).toContain("Ascensor");
    expect(html).toContain("Exterior");
  });

  it("draws the location as the approximate zone circle on ICGC colour tiles, never a pin", async () => {
    const html = await render();
    expect(html).toContain("/mapa-base/wmts/estandard/MON3857NW/14/");
    expect(html).toMatch(/<circle[^>]*class="property-map-area"[^>]*r="69\.76"/);
    expect(html).not.toMatch(/leaflet|marker-icon|<path/i);
    expect(html).toContain("Ubicación aproximada");
    expect(html).toContain("© Institut Cartogràfic i Geològic de Catalunya (ICGC), CC BY 4.0.");
  });

  it("leaves the map out when Mobilia sends no zone", async () => {
    const html = await render(makeProperty("DEMO-002", { prices: { sale: amount(1) } }));
    expect(html).not.toContain("<circle");
    expect(html).not.toContain("geoserveis.icgc.cat");
  });

  it("embeds photos as JPEG (passed through to the PDF without re-encoding)", async () => {
    const html = await render();
    const images = [...html.matchAll(/<img[^>]*src="([^"]*_image[^"]*)"/g)].map((m) => m[1]);
    expect(images).toHaveLength(5);
    for (const src of images) expect(src).toContain("f=jpg");
    // Print never scrolls: a lazy image below the first page would print blank.
    expect(html).not.toContain('loading="lazy"');
  });

  it("links every CTA to absolute URLs (they must work from the downloaded PDF)", async () => {
    const html = await render();
    expect(html).toMatch(
      /href="https:\/\/www\.housyspace\.com\/es\/venta\/piso-senorial-con-balcon-demo-001#detail-contact"/,
    );
    expect(html).toContain('href="tel:+34613084804"');
    expect(html).toMatch(/href="https:\/\/wa\.me\/34613084804\?text=[^"]*DEMO-001/i);
    expect(html).toContain('href="https://www.housyspace.com/es"');
  });

  it("shows the energy scale, company data with AICAT and the disclaimer, without demo notices", async () => {
    const html = await render();
    expect(html).toContain("Escala de A a G: letra D");
    expect(html).toContain("CIF B26903419");
    expect(html).toContain("14032");
    expect(html).toContain("Ficha informativa sin valor contractual.");
    expect(html).not.toMatch(/demostraci[oó]n|generadas con IA/i);
  });

  it("shows the monthly price on rental sheets", async () => {
    const rental = makeProperty("DEMO-004", {
      operations: ["rent"],
      prices: { rent: amount(2900) },
    });
    const html = await render(rental, "rent");
    expect(html).toMatch(/2\.900\s€/);
    expect(html).toContain("/mes");
  });
});
