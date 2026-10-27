import { describe, expect, it } from "vitest";
import { hasBalancedEmphasis, splitEmphasis } from "./emphasis";

describe("splitEmphasis", () => {
  it("turns *marked* words into emphasised segments, keeping the text around them", () => {
    expect(splitEmphasis("Tres inmuebles que *representan lo que hacemos*.")).toEqual([
      { text: "Tres inmuebles que ", emphasis: false },
      { text: "representan lo que hacemos", emphasis: true },
      { text: ".", emphasis: false },
    ]);
  });

  it("supports several emphasised parts and none at all", () => {
    expect(splitEmphasis("*Uno* y *dos*")).toEqual([
      { text: "Uno", emphasis: true },
      { text: " y ", emphasis: false },
      { text: "dos", emphasis: true },
    ]);
    expect(splitEmphasis("Sin énfasis")).toEqual([{ text: "Sin énfasis", emphasis: false }]);
  });

  it("keeps a lone asterisk as text instead of guessing", () => {
    expect(splitEmphasis("Precio * a consultar")).toEqual([
      { text: "Precio * a consultar", emphasis: false },
    ]);
  });
});

describe("hasBalancedEmphasis", () => {
  it("accepts paired markers and rejects an unclosed one (the CMS form shows the error)", () => {
    expect(hasBalancedEmphasis("Lo que dicen *de HousySpace*.")).toBe(true);
    expect(hasBalancedEmphasis("Sin énfasis")).toBe(true);
    expect(hasBalancedEmphasis("Lo que dicen *de HousySpace.")).toBe(false);
  });
});
