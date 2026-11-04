import { describe, expect, it } from "vitest";
import { neighboursInComarca } from "./municipalities";

const list = [
  { slug: "badalona", name: "Badalona", comarca: "Barcelonès" },
  { slug: "abrera", name: "Abrera", comarca: "Baix Llobregat" },
  { slug: "barcelona", name: "Barcelona", comarca: "Barcelonès" },
  { slug: "sant-adria-de-besos", name: "Sant Adrià de Besòs", comarca: "Barcelonès" },
];

describe("neighboursInComarca", () => {
  it("lists the other municipalities of the same comarca, by name", () => {
    expect(neighboursInComarca(list, "barcelona").map((item) => item.slug)).toEqual([
      "badalona",
      "sant-adria-de-besos",
    ]);
  });

  it("returns nothing for an unknown municipality", () => {
    expect(neighboursInComarca(list, "nowhere")).toEqual([]);
  });
});
