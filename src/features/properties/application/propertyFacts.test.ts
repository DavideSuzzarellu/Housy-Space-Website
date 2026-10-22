import { describe, expect, it } from "vitest";
import { toAreaM2 } from "../domain/property";
import { makeProperty } from "../testing/makeProperty";
import {
  presentDescription,
  presentEnergyRating,
  presentKeyFacts,
  presentMetaLine,
  presentPhotos,
} from "./propertyFacts";

const property = makeProperty("1001", {
  builtArea: toAreaM2(1480),
  usableArea: toAreaM2(132),
  bedrooms: 3,
  bathrooms: 2,
  toilets: 0,
  floor: "5",
  yearBuilt: 1910,
  features: ["lift", "terrace", "parking", "exterior"],
});

const normalize = (value: string): string => value.replace(/[\u00a0\u202f]/g, " ");

describe("presentKeyFacts", () => {
  it("lists the available facts in a stable order with localized labels and units", () => {
    const facts = presentKeyFacts(property, "es").map((fact) => ({
      ...fact,
      value: normalize(fact.value),
    }));
    expect(facts).toEqual([
      { key: "builtArea", label: "Superficie construida", value: "1.480 m²" },
      { key: "usableArea", label: "Superficie útil", value: "132 m²" },
      { key: "bedrooms", label: "Dormitorios", value: "3" },
      { key: "bathrooms", label: "Baños", value: "2" },
      { key: "floor", label: "Planta", value: "5" },
      { key: "lift", label: "Ascensor", value: "Sí" },
      { key: "terrace", label: "Terraza", value: "Sí" },
      { key: "parking", label: "Parking", value: "Sí" },
      { key: "yearBuilt", label: "Año de construcción", value: "1910" },
    ]);
  });

  it("shows the terrace area instead of a yes when it is known", () => {
    const facts = presentKeyFacts(
      makeProperty("1", { features: ["terrace"], terraceArea: toAreaM2(12) }),
      "en",
    );
    expect(facts.map((fact) => [fact.key, normalize(fact.value)])).toEqual([["terrace", "12 m²"]]);
  });

  it("omits facts Mobilia does not provide (never invents a 'no')", () => {
    expect(presentKeyFacts(makeProperty(), "it")).toEqual([]);
  });

  it("localizes labels and number formatting", () => {
    const facts = presentKeyFacts(property, "en");
    expect(facts[0]).toEqual({ key: "builtArea", label: "Built area", value: "1,480 m²" });
    expect(facts.find((fact) => fact.key === "lift")?.value).toBe("Yes");
  });
});

describe("presentEnergyRating", () => {
  it("shows the grade, pending certification, exemption or not available", () => {
    expect(presentEnergyRating({ kind: "grade", grade: "D" }, "es")).toBe("D");
    expect(presentEnergyRating({ kind: "pending" }, "es")).toBe("Pendiente de certificar");
    expect(presentEnergyRating({ kind: "exempt" }, "en")).toBe("Exempt");
    expect(presentEnergyRating(undefined, "es")).toBe("No disponible");
  });
});

describe("presentDescription", () => {
  it("splits the localized description into trimmed paragraphs", () => {
    const listing = makeProperty("1", { description: { es: " Uno.\n\n\nDos.\nSigue. \n\n " } });
    expect(presentDescription(listing, "es")).toEqual(["Uno.", "Dos.\nSigue."]);
  });

  it("falls back to the summary, then to nothing", () => {
    expect(presentDescription(makeProperty("1", { summary: { en: "Short." } }), "it")).toEqual([
      "Short.",
    ]);
    expect(presentDescription(makeProperty(), "es")).toEqual([]);
  });
});

describe("presentMetaLine", () => {
  it("joins reference, operation and type, skipping what Mobilia does not send", () => {
    expect(
      presentMetaLine(makeProperty("ab-1", { propertyType: { es: "Piso" } }), "rent", "es"),
    ).toBe("Ref. ab-1 · Alquiler · Piso");
    expect(presentMetaLine(makeProperty("ab-1"), "sale", "en")).toBe("Ref. ab-1 · Sale");
  });
});

describe("presentPhotos", () => {
  it("uses the caption as alt text, else a numbered alt with the title", () => {
    const listing = makeProperty("1", {
      photos: [
        { url: "https://x/1.jpg", caption: { es: "Salón" } },
        { url: "https://x/2.jpg", caption: {} },
      ],
    });
    expect(presentPhotos(listing, "Ático", "es")).toEqual([
      { src: "https://x/1.jpg", alt: "Salón" },
      { src: "https://x/2.jpg", alt: "Fotografía del inmueble: Ático (2/2)" },
    ]);
  });
});
