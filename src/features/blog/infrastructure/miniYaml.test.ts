import { describe, expect, it } from "vitest";
import { parseMiniYaml } from "./miniYaml";

describe("parseMiniYaml", () => {
  it("reads scalars, comments, empty values and typed literals", () => {
    const data = parseMiniYaml(
      [
        "# a comment",
        "title: ¿Cuánto vale mi piso? # trailing comment",
        "date: 2026-12-01",
        "pillar: true",
        "legalFiscal: false",
        "n: 42",
        "price: 1.5",
        "author:",
        "seoTitle: # only a comment",
        "empty: ~",
        "id: HS-2026-12-01",
      ].join("\n"),
    );
    expect(data).toEqual({
      title: "¿Cuánto vale mi piso?",
      date: "2026-12-01",
      pillar: true,
      legalFiscal: false,
      n: 42,
      price: 1.5,
      author: null,
      seoTitle: null,
      empty: null,
      id: "HS-2026-12-01",
    });
  });

  it("reads quoted strings with their escapes and colons inside", () => {
    expect(
      parseMiniYaml(
        ['a: "Dice: \\"hola\\" # no es comentario"', "b: 'it''s: fine'", 'c: "línea\\nnueva"'].join(
          "\n",
        ),
      ),
    ).toEqual({ a: 'Dice: "hola" # no es comentario', b: "it's: fine", c: "línea\nnueva" });
  });

  it("reads sequences of scalars, with or without indentation under the key", () => {
    expect(parseMiniYaml("a:\n  - uno\n  - dos\nb:\n- tres\nc: []\nd: [x, 'y z']")).toEqual({
      a: ["uno", "dos"],
      b: ["tres"],
      c: [],
      d: ["x", "y z"],
    });
  });

  it("reads sequences of mappings (the `sources` field)", () => {
    const data = parseMiniYaml(
      [
        "sources:",
        "  - label: BOE",
        "    url: https://www.boe.es/",
        "    checkedAt: 2026-11-20",
        "  - label: ATC",
        "    url: https://atc.gencat.cat/",
        "    checkedAt: 2026-11-21",
        "after: ok",
      ].join("\n"),
    );
    expect(data).toEqual({
      sources: [
        { label: "BOE", url: "https://www.boe.es/", checkedAt: "2026-11-20" },
        { label: "ATC", url: "https://atc.gencat.cat/", checkedAt: "2026-11-21" },
      ],
      after: "ok",
    });
  });

  it("reads folded and literal block scalars like the CMS writes long text", () => {
    const data = parseMiniYaml(
      [
        "description: >-",
        "  primera línea",
        "  segunda línea",
        "",
        "  otro párrafo",
        "next: |",
        "  a",
        "  b",
        "end: 1",
      ].join("\n"),
    );
    expect(data).toEqual({
      description: "primera línea segunda línea\notro párrafo",
      next: "a\nb\n",
      end: 1,
    });
  });

  it("fails loudly on YAML it does not support instead of guessing", () => {
    expect(() => parseMiniYaml("a: &anchor 1")).toThrow(/anchors/i);
    expect(() => parseMiniYaml("a: 1\n\tb: 2")).toThrow(/tab/i);
  });
});
