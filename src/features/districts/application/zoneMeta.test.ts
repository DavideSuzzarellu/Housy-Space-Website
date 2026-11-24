import { describe, expect, it } from "vitest";
import { getDictionary } from "@/shared/i18n";
import { LOCALES } from "@/shared/i18n/config";
import { barrioMeta, districtMeta, lowerLeadingArticle } from "./zoneMeta";

const es = getDictionary("es").zones;

describe("lowerLeadingArticle", () => {
  it.each([
    ["El Raval", "el Raval"],
    ["La Barceloneta", "la Barceloneta"],
    ["Les Tres Torres", "les Tres Torres"],
    ["L'Antiga Esquerra de l'Eixample", "l'Antiga Esquerra de l'Eixample"],
    ["Hostafrancs", "Hostafrancs"],
    ["Elisenda", "Elisenda"],
    ["Sant Gervasi-la Bonanova", "Sant Gervasi-la Bonanova"],
  ])("%s -> %s", (name, expected) => {
    expect(lowerLeadingArticle(name)).toBe(expected);
  });
});

describe("zone meta (Spanish source = the client's SEO matrix)", () => {
  it("builds a district title and description from its lead", () => {
    const meta = districtMeta(es, {
      name: "Gràcia",
      lead: "Un antiguo pueblo dentro de la ciudad.",
    });
    expect(meta.title).toBe("Vivir en Gràcia: barrios, precios y ambiente · HousySpace");
    expect(meta.description).toBe(
      "Un antiguo pueblo dentro de la ciudad. Precios de compraventa y alquiler y cómo es cada uno de sus barrios.",
    );
  });

  it("builds a barrio title with its district and the article in lower case", () => {
    const meta = barrioMeta(es, {
      name: "El Raval",
      district: "Ciutat Vella",
      lead: "El barrio más poblado de Ciutat Vella.",
    });
    expect(meta.title).toBe("Vivir en el Raval, Ciutat Vella: precio y ambiente · HousySpace");
    expect(meta.description).toBe(
      "El barrio más poblado de Ciutat Vella. Precio de la vivienda, servicios y cómo es vivir en el barrio.",
    );
  });

  it("keeps official names untouched in every locale and never leaves a placeholder", () => {
    for (const locale of LOCALES) {
      const zones = getDictionary(locale).zones;
      const barrio = barrioMeta(zones, {
        name: "La Dreta de l'Eixample",
        district: "Eixample",
        lead: "x.",
      });
      const district = districtMeta(zones, { name: "Sarrià-Sant Gervasi", lead: "x." });
      expect(barrio.title.toLowerCase()).toContain("dreta de l'eixample");
      expect(district.title).toContain("Sarrià-Sant Gervasi");
      for (const text of [barrio.title, barrio.description, district.title, district.description]) {
        expect(text).not.toMatch(/[{}]/);
      }
    }
  });
});
