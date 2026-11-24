import { describe, expect, it } from "vitest";
import { linkBarrioNames } from "./linkBarrios";

const barrios = [
  { slug: "sants", name: "Sants" },
  { slug: "sants-badal", name: "Sants-Badal" },
  { slug: "la-dreta-de-leixample", name: "La Dreta de l'Eixample" },
];

describe("linkBarrioNames", () => {
  it("links names in running text and keeps the rest", () => {
    const text = "de 4.310 €/m² en Sants a 6.224 €/m² en la Dreta de l'Eixample.";
    const segments = linkBarrioNames(text, barrios);
    expect(segments.filter((s) => s.slug).map((s) => [s.text, s.slug])).toEqual([
      ["Sants", "sants"],
      ["la Dreta de l'Eixample", "la-dreta-de-leixample"],
    ]);
    expect(segments.map((s) => s.text).join("")).toBe(text);
  });

  it("prefers the longest name", () => {
    const segments = linkBarrioNames("3.958 €/m² en Sants-Badal", barrios);
    expect(segments.filter((s) => s.slug).map((s) => s.slug)).toEqual(["sants-badal"]);
  });

  it("leaves paragraphs without prices alone", () => {
    expect(linkBarrioNames("Sants es un barrio.", barrios)).toEqual([
      { text: "Sants es un barrio." },
    ]);
  });
});
