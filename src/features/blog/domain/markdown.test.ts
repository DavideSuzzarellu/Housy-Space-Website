import { describe, expect, it } from "vitest";
import {
  countWords,
  extractHeadings,
  extractLinks,
  firstWords,
  readingMinutes,
  READING_WORDS_PER_MINUTE,
} from "./markdown";

const BODY = `Intro con **negrita** y un [enlace](/es/valoracion).

## Primera pregunta

Texto con [otro](https://www.boe.es/x#a) y <a href="/es/contacto">html</a>.

\`\`\`
## no es un titulo
[no](/es/enlace)
\`\`\`

### Detalle

## Segunda pregunta
`;

describe("extractHeadings", () => {
  it("returns depth and text, ignoring fenced code", () => {
    expect(extractHeadings(BODY)).toEqual([
      { depth: 2, text: "Primera pregunta" },
      { depth: 3, text: "Detalle" },
      { depth: 2, text: "Segunda pregunta" },
    ]);
  });

  it("detects a body h1 in markdown and in raw HTML", () => {
    expect(extractHeadings("# Titulo\n\ntexto").map((h) => h.depth)).toEqual([1]);
    expect(extractHeadings("<h1>Titulo</h1>").map((h) => h.depth)).toEqual([1]);
  });
});

describe("extractLinks", () => {
  it("finds markdown and html links outside code", () => {
    expect(extractLinks(BODY)).toEqual([
      { text: "enlace", href: "/es/valoracion" },
      { text: "otro", href: "https://www.boe.es/x#a" },
      { text: "html", href: "/es/contacto" },
    ]);
  });

  it("does not take images as links", () => {
    expect(extractLinks("![alt](/a.png) y [x](/es/vender)")).toEqual([
      { text: "x", href: "/es/vender" },
    ]);
  });
});

describe("words and reading time", () => {
  it("counts words without markdown syntax or urls", () => {
    expect(countWords("Hola **mundo** [enlace largo](/es/ruta/larga)\n\n## Título")).toBe(5);
  });

  it("rounds reading time up at 200 words per minute, minimum one", () => {
    expect(READING_WORDS_PER_MINUTE).toBe(200);
    expect(readingMinutes("palabra ".repeat(200))).toBe(1);
    expect(readingMinutes("palabra ".repeat(201))).toBe(2);
    expect(readingMinutes("")).toBe(1);
  });

  it("takes the first words of the text", () => {
    expect(firstWords("Uno **dos** tres cuatro", 3)).toBe("Uno dos tres");
  });
});
