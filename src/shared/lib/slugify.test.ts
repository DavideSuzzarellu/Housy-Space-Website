import { describe, expect, it } from "vitest";
import { slugify } from "./slugify";

describe("slugify", () => {
  it("lowercases and joins words with hyphens", () => {
    expect(slugify("Piso Luminoso en Eixample")).toBe("piso-luminoso-en-eixample");
  });

  it("strips accents and diacritics to ASCII", () => {
    expect(slugify("Gràcia")).toBe("gracia");
    expect(slugify("Sant Martí de Provençals")).toBe("sant-marti-de-provencals");
    expect(slugify("Ático dúplex con piscina")).toBe("atico-duplex-con-piscina");
    expect(slugify("Città più bella")).toBe("citta-piu-bella");
  });

  it("removes the Catalan middle dot without splitting the word", () => {
    expect(slugify("Col·legi de Sant Gervasi")).toBe("collegi-de-sant-gervasi");
  });

  it("turns apostrophes and punctuation into single separators", () => {
    expect(slugify("l'Antiga Esquerra de l'Eixample")).toBe("l-antiga-esquerra-de-l-eixample");
    expect(slugify("Sant Gervasi - la Bonanova")).toBe("sant-gervasi-la-bonanova");
    expect(slugify("  3 hab., 2 baños / terraza!  ")).toBe("3-hab-2-banos-terraza");
  });

  it("returns only lowercase ASCII letters, digits and single hyphens", () => {
    const result = slugify("¿Ñandú? Œuvre — Straße «øæ» 100%");
    expect(result).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    expect(result).toBe("nandu-oeuvre-strasse-oae-100");
  });

  it("returns an empty string when nothing slug-safe remains", () => {
    expect(slugify("¡¿?!")).toBe("");
  });

  it("truncates at a word boundary when maxLength is given", () => {
    const result = slugify("Magnífico piso reformado con vistas al mar en Barceloneta", {
      maxLength: 30,
    });
    expect(result.length).toBeLessThanOrEqual(30);
    expect(result).toBe("magnifico-piso-reformado-con");
  });

  it("hard-cuts a single long word that exceeds maxLength", () => {
    expect(slugify("supercalifragilistic", { maxLength: 5 })).toBe("super");
  });
});
