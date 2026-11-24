import { describe, expect, it } from "vitest";
import {
  extractQuotedFigures,
  isKnownFigure,
  unknownFigures,
  type AllowedFigures,
} from "./marketFigures";

const ALLOWED: AllowedFigures = { perM2: [4254, 18.13, 1801], perMonth: [1135, 555] };

describe("extractQuotedFigures", () => {
  it("reads euro figures per m² and per month in the notations the site uses", () => {
    const text =
      "Se paga a 4.254 €/m², 4254 euros/m2, 18,13 €/m² y 1.135 €/mes (o 1,135 € al mes).";
    expect(extractQuotedFigures(text)).toEqual([
      { value: 4254, unit: "perM2", raw: "4.254 €/m²" },
      { value: 4254, unit: "perM2", raw: "4254 euros/m2" },
      { value: 18.13, unit: "perM2", raw: "18,13 €/m²" },
      { value: 1135, unit: "perMonth", raw: "1.135 €/mes" },
      { value: 1135, unit: "perMonth", raw: "1,135 € al mes" },
    ]);
  });

  it("reads the units of every locale and the currency-first notation", () => {
    const text = "3.499 €/m², 1.234 €/mes, 1,234 €/month, 1.234 €/mese and €3,499/m²";
    expect(extractQuotedFigures(text).map((figure) => [figure.value, figure.unit])).toEqual([
      [3499, "perM2"],
      [1234, "perMonth"],
      [1234, "perMonth"],
      [1234, "perMonth"],
      [3499, "perM2"],
    ]);
  });

  it("ignores plain prices and numbers without a market unit", () => {
    expect(extractQuotedFigures("Un piso de 300.000 € con 80 m² y 3 habitaciones.")).toEqual([]);
  });
});

describe("isKnownFigure", () => {
  it("accepts a market value, also rounded to the unit, and rejects the rest", () => {
    expect(isKnownFigure({ value: 4254, unit: "perM2", raw: "" }, ALLOWED)).toBe(true);
    expect(isKnownFigure({ value: 18.13, unit: "perM2", raw: "" }, ALLOWED)).toBe(true);
    expect(isKnownFigure({ value: 18, unit: "perM2", raw: "" }, ALLOWED)).toBe(true);
    expect(isKnownFigure({ value: 4300, unit: "perM2", raw: "" }, ALLOWED)).toBe(false);
    expect(isKnownFigure({ value: 18.5, unit: "perM2", raw: "" }, ALLOWED)).toBe(false);
  });

  it("never mixes units", () => {
    expect(isKnownFigure({ value: 1135, unit: "perM2", raw: "" }, ALLOWED)).toBe(false);
    expect(isKnownFigure({ value: 4254, unit: "perMonth", raw: "" }, ALLOWED)).toBe(false);
  });
});

describe("unknownFigures", () => {
  it("returns only the quoted figures that are not market values", () => {
    const found = unknownFigures("A 4.254 €/m² frente a 9.999 €/m² y 1.135 €/mes.", ALLOWED);
    expect(found.map((figure) => figure.raw)).toEqual(["9.999 €/m²"]);
  });
});
