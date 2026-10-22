import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";
import { buildCatalog } from "../application/catalog";
import { toAreaM2, toIsoDateTime } from "../domain/property";
import { amount, approximateIn, makeProperty } from "../testing/makeProperty";
import PropertyCatalog from "./PropertyCatalog.astro";

const properties = [
  makeProperty("a1", {
    title: { es: "Piso con terraza </script><b>x</b>" },
    prices: { sale: amount(300000) },
    builtArea: toAreaM2(80),
    propertyType: { es: "Pisos" },
    location: approximateIn("El Clot"),
    features: ["terrace"],
    updatedAt: toIsoDateTime("2026-10-02T00:00:00Z"),
  }),
  makeProperty("b2", {
    title: { es: "Ático en Gràcia" },
    prices: { sale: amount(900000) },
    location: approximateIn("Gràcia"),
    updatedAt: toIsoDateTime("2026-10-05T00:00:00Z"),
  }),
];

let container: AstroContainer;

beforeAll(async () => {
  container = await AstroContainer.create();
});

async function render(list = properties): Promise<string> {
  return container.renderToString(PropertyCatalog, {
    props: { locale: "es", operation: "sale", model: buildCatalog(list, "sale", "es") },
  });
}

describe("PropertyCatalog", () => {
  it("renders every listing server-side, most recent first (works without JS)", async () => {
    const html = await render();
    const refs = [...html.matchAll(/data-catalog-ref="([^"]+)"/g)].map((match) => match[1]);
    expect(refs).toEqual(["b2", "a1"]);
    expect(html).toContain("2 inmuebles");
  });

  it("names every filter control after its URL param", async () => {
    const html = await render();
    for (const name of ["zona", "tipo", "pmin", "pmax", "smin", "smax", "hab", "ban", "car"]) {
      expect(html).toContain(`name="${name}"`);
    }
    expect(html).toMatch(/<select[^>]*name="orden"[^>]*form="catalog-filters"/);
  });

  it("offers the zones, types and features present in the listings", async () => {
    const html = await render();
    expect(html).toContain('<option value="el-clot">El Clot</option>');
    expect(html).toContain('<option value="pisos">Pisos</option>');
    expect(html).toMatch(/value="terrace"/);
  });

  it("links the operation switch to both listings and marks the current one", async () => {
    const html = await render();
    expect(html).toMatch(/<a[^>]*href="\/es\/venta"[^>]*aria-current="page"/);
    expect(html).toContain('href="/es/alquiler"');
  });

  it("starts in list view with the map deferred until requested", async () => {
    const html = await render();
    expect(html).toContain('data-view="list"');
    expect(html).toMatch(/data-catalog-view="list"[^>]*aria-pressed="true"/);
    expect(html).toContain("data-catalog-map");
    expect(html).not.toContain("leaflet-container");
  });

  it("embeds the island payload without letting CRM text break out of the script", async () => {
    const html = await render();
    const payload = /<script[^>]*data-catalog-entries[^>]*>([\s\S]*?)<\/script>/.exec(html)?.[1];
    expect(payload).toBeDefined();
    expect(payload).not.toContain("</script>");
    expect(payload).toContain("\\u003c/script\\u003e");
  });

  it("shows an empty-catalog message when nothing is published", async () => {
    const html = await render([]);
    expect(html).toContain("Ahora mismo no hay inmuebles publicados en esta sección.");
    expect(html).not.toContain("data-catalog-ref");
  });
});
