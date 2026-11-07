import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";
import MunicipalitiesView from "./MunicipalitiesView.astro";
import MunicipalityView from "./MunicipalityView.astro";

const data = {
  source: { provider: "ICGC", url: "https://www.icgc.cat/", license: "CC BY 4.0" },
  municipalities: [
    { code: "080155", name: "Badalona", slug: "badalona", comarca: "Barcelonès", areaKm2: 21.2 },
    {
      code: "080193",
      name: "Barcelona",
      slug: "barcelona",
      comarca: "Barcelonès",
      areaKm2: 101.67,
    },
    { code: "080018", name: "Abrera", slug: "abrera", comarca: "Baix Llobregat", areaKm2: 19.98 },
  ],
};

let container: AstroContainer;

beforeAll(async () => {
  container = await AstroContainer.create();
});

describe("MunicipalityView", () => {
  it("shows the official data and never estimates population or density", async () => {
    const html = await container.renderToString(MunicipalityView, {
      props: { locale: "es", data, slug: "badalona" },
    });
    expect(html).toContain("<h1");
    expect(html).toContain("Badalona");
    expect(html).toContain("080155");
    expect(html).toContain("21,2 km²");
    expect(html.match(/No disponible/g)).toHaveLength(2);
    expect(html).toContain('href="https://www.icgc.cat/"');
    expect(html).toContain('href="/es/provincia-de-barcelona/barcelona"');
    expect(html).toContain('href="/es/provincia-de-barcelona"');
  });

  it("links the city of Barcelona to Living in Barcelona", async () => {
    const html = await container.renderToString(MunicipalityView, {
      props: { locale: "en", data, slug: "barcelona" },
    });
    expect(html).toContain('href="/en/living-in-barcelona"');
    expect(html).toContain("Not available");
  });
});

describe("MunicipalitiesView", () => {
  it("lists every municipality with its comarca, code and area", async () => {
    const html = await container.renderToString(MunicipalitiesView, {
      props: { locale: "es", data },
    });
    expect(html).toContain("<table");
    expect(html.match(/<tr/g)).toHaveLength(4);
    expect(html).toContain('href="/es/provincia-de-barcelona/abrera"');
    expect(html).toContain("19,98");
  });
});
