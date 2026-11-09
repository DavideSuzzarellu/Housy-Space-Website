import { describe, expect, it } from "vitest";
import { tokenizeWords } from "./words";

describe("tokenizeWords", () => {
  it("keeps the original text intact when the tokens are joined", () => {
    const text = "  Cada persona,  un nuevo\ncomienzo ";
    expect(
      tokenizeWords(text)
        .map((token) => token.text)
        .join(""),
    ).toBe(text);
  });

  it("marks words and whitespace separately", () => {
    expect(tokenizeWords("¡No te preocupes!")).toEqual([
      { text: "¡No", isWord: true },
      { text: " ", isWord: false },
      { text: "te", isWord: true },
      { text: " ", isWord: false },
      { text: "preocupes!", isWord: true },
    ]);
  });

  it("returns nothing for empty text", () => {
    expect(tokenizeWords("")).toEqual([]);
  });
});
