import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";
import { toAreaM2 } from "../domain/property";
import { amount, approximateIn, makeProperty } from "../testing/makeProperty";
import PropertyDetail from "./PropertyDetail.astro";

const property = makeProperty("1001", {
  title: { es: "Piso señorial con balcón" },
  prices: { sale: amount(1250000) },
  builtArea: toAreaM2(148),
  description: { es: "Piso en venta de 148 m²." },
  features: ["terrace", "lift"],
  location: approximateIn("La Dreta de l'Eixample"),
  propertyType: { es: "Piso" },
});
const similar = [
  makeProperty("2002", { title: { es: "Ático en Sarrià" }, prices: { sale: amount(1480000) } }),
];

let container: AstroContainer;

beforeAll(async () => {
  container = await AstroContainer.create();
});

async function render(): Promise<string> {
  const html = await container.renderToString(PropertyDetail, {
    props: { locale: "es", property, operation: "sale", agent: undefined, similar },
  });
  return html.replace(/[\u00a0\u202f]/g, " ");
}

const aside = (html: string): string => /<aside[\s\S]*?<\/aside>/.exec(html)?.[0] ?? "";

describe("PropertyDetail (reference layout)", () => {
  it("puts the price, reference and the four actions in the side box", async () => {
    const box = aside(await render());
    expect(box).toContain("1.250.000 €");
    expect(box).toContain("Ref. 1001");
    for (const label of ["Solicitar visita", "WhatsApp", ">Llamar<", "Descargar ficha PDF"]) {
      expect(box).toContain(label);
    }
    expect(box).not.toContain("Un asesor de HousySpace te atenderá personalmente.");
  });

  it("does not repeat the price under the title", async () => {
    const html = await render();
    const withoutAside = html.replace(aside(html), "");
    expect(withoutAside.match(/1\.250\.000 €/g) ?? []).toHaveLength(0);
  });

  it("orders the blocks like the reference: description, features, location, energy", async () => {
    const html = await render();
    const at = (id: string) => html.indexOf(`id="${id}"`);
    expect(at("detail-description")).toBeLessThan(at("detail-features"));
    expect(at("detail-features")).toBeLessThan(at("detail-location"));
    expect(at("detail-location")).toBeLessThan(at("detail-energy"));
  });

  it("calls the similar listings related properties and offers the way back to the catalog", async () => {
    const html = await render();
    expect(html).toContain("Propiedades relacionadas");
    expect(html).toMatch(/<a[^>]*href="\/es\/venta"[^>]*>[\s\S]*?Volver al catálogo/);
    expect(html).toContain("Ubicación aproximada");
  });
});
