import { describe, expect, it } from "vitest";
import { BANNED_CLAIMS, findBannedClaims } from "./bannedClaims";

describe("findBannedClaims", () => {
  it("finds the client's forbidden promises in Spanish, ignoring case and accents", () => {
    const text = "Una Rentabilidad ASEGURADA y el mejor precio, todo sin riesgo.";
    expect(findBannedClaims(text, "es")).toEqual([
      "rentabilidad asegurada",
      "el mejor precio",
      "sin riesgo",
    ]);
  });

  it("has equivalents in every locale", () => {
    expect(findBannedClaims("This is a risk-free, guaranteed return.", "en")).toEqual([
      "guaranteed return",
      "risk-free",
    ]);
    expect(findBannedClaims("Il miglior prezzo, senza rischio.", "it")).toEqual([
      "il miglior prezzo",
      "senza rischio",
    ]);
    expect(findBannedClaims("Rendibilitat assegurada i preu garantit.", "ca")).toEqual([
      "rendibilitat assegurada",
      "preu garantit",
    ]);
  });

  it("matches whole words only and does not use another language's list", () => {
    expect(findBannedClaims("Un piso garantizadoras", "es")).toEqual([]);
    expect(findBannedClaims("garantizado", "en")).toEqual([]);
    expect(findBannedClaims("El precio garantizado es una promesa.", "es")).toEqual([
      "precio garantizado",
    ]);
  });

  it("covers the five phrases of the brief in Spanish", () => {
    for (const phrase of [
      "rentabilidad asegurada",
      "garantizado",
      "sin riesgo",
      "el mejor precio",
      "precio garantizado",
    ]) {
      expect(BANNED_CLAIMS.es).toContain(phrase);
    }
  });
});
