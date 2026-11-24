import { describe, expect, it } from "vitest";
import { jaccard, shingles } from "./similarity";

describe("shingles", () => {
  it("builds runs of five normalized words", () => {
    expect([...shingles("Uno, DOS tres cuatro cinco seis")]).toEqual([
      "uno dos tres cuatro cinco",
      "dos tres cuatro cinco seis",
    ]);
  });

  it("is empty for a text shorter than one shingle", () => {
    expect(shingles("solo tres palabras").size).toBe(0);
  });
});

describe("jaccard", () => {
  const text = "vender un piso en barcelona exige preparar la documentacion y fijar bien el precio";

  it("is 1 for identical text and 0 for unrelated text", () => {
    expect(jaccard(shingles(text), shingles(text))).toBe(1);
    expect(
      jaccard(shingles(text), shingles("nada que ver con lo anterior en absoluto ninguno")),
    ).toBe(0);
    expect(jaccard(new Set(), new Set())).toBe(0);
  });

  it("is high for a lightly edited copy and low for a related article", () => {
    const edited = `${text} y cerrar la venta`;
    expect(jaccard(shingles(text), shingles(edited))).toBeGreaterThan(0.6);
    const related = "vender un piso en barcelona es un proceso con varias fases distintas";
    expect(jaccard(shingles(text), shingles(related))).toBeLessThan(0.2);
  });
});
