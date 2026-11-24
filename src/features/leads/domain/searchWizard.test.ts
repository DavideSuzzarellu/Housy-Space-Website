import { describe, expect, it } from "vitest";
import {
  buildSummaryRows,
  formatAmount,
  invalidFields,
  parseAmount,
  searchZones,
  stepFields,
  type SearchState,
  type SummaryLabels,
  type ZoneEntry,
} from "./searchWizard";

const labels: SummaryLabels = {
  operation: "Operación",
  type: "Tipo de vivienda",
  zones: "Zonas",
  altZones: "Zonas alternativas",
  otherZones: "Otras zonas",
  budget: "Presupuesto",
  rent: "Renta",
  area: "Superficie",
  rooms: "Habitaciones",
  baths: "Baños",
  must: "Imprescindible",
  nice: "Deseable",
  status: "Estado",
  term: "Plazo",
  buy: "Comprar",
  rentOp: "Alquilar",
  wholeDistrict: "{name} (todo el distrito)",
  from: "Desde {n} {u}",
  upTo: "Hasta {n} {u}",
  between: "{min} – {max} {u}",
  orMore: "{n} o más",
  perMonth: "€/mes",
  euro: "€",
  squareMetres: "m²",
  thousands: ".",
};

const empty: SearchState = {
  operation: "",
  types: [],
  zones: [],
  openToOthers: "",
  priceMin: null,
  priceMax: null,
  areaMin: null,
  areaMax: null,
  rooms: "",
  baths: "",
  must: [],
  nice: [],
  status: [],
  term: "",
};

describe("amounts", () => {
  it("parses what people type, dropping thousands dots and cents", () => {
    expect(parseAmount("300.000")).toBe(300000);
    expect(parseAmount(" 1.250,50 ")).toBe(1250);
    expect(parseAmount("abc")).toBeNull();
    expect(parseAmount("")).toBeNull();
  });

  it("formats with the thousands separator of the language", () => {
    expect(formatAmount(650000, ",")).toBe("650,000");
    expect(formatAmount(650000)).toBe("650.000");
    expect(formatAmount(900)).toBe("900");
  });
});

describe("summary of the ideal home", () => {
  it("is empty until something is chosen", () => {
    expect(buildSummaryRows(empty, labels)).toEqual([]);
  });

  it("describes a purchase with a budget range, in the reference order", () => {
    const rows = buildSummaryRows(
      {
        ...empty,
        operation: "venta",
        types: ["Piso", "Ático"],
        priceMin: 300000,
        priceMax: 650000,
        rooms: "2",
        must: ["Terraza"],
        nice: ["Balcón"],
      },
      labels,
    );
    expect(rows).toEqual([
      ["Operación", "Comprar"],
      ["Tipo de vivienda", "Piso, Ático"],
      ["Presupuesto", "300.000 – 650.000 €"],
      ["Habitaciones", "2 o más"],
      ["Imprescindible", "Terraza"],
      ["Deseable", "Balcón"],
    ]);
  });

  it("uses rent wording and one-sided ranges for rentals", () => {
    const rows = buildSummaryRows({ ...empty, operation: "alquiler", priceMax: 1800 }, labels);
    expect(rows).toEqual([
      ["Operación", "Alquilar"],
      ["Renta", "Hasta 1.800 €/mes"],
    ]);
    expect(buildSummaryRows({ ...empty, priceMax: 1800 }, { ...labels, thousands: "," })).toEqual([
      ["Presupuesto", "Hasta 1,800 €"],
    ]);
    expect(buildSummaryRows({ ...empty, areaMin: 70 }, labels)).toEqual([
      ["Superficie", "Desde 70 m²"],
    ]);
  });

  it("splits preferred and alternative zones and marks whole districts", () => {
    const zones: ZoneEntry[] = [
      { name: "Eixample", wholeDistrict: true, alternative: false },
      { name: "El Clot", wholeDistrict: false, alternative: true },
    ];
    expect(buildSummaryRows({ ...empty, zones, openToOthers: "Estoy abierto" }, labels)).toEqual([
      ["Zonas", "Eixample (todo el distrito)"],
      ["Zonas alternativas", "El Clot"],
      ["Otras zonas", "Estoy abierto"],
    ]);
  });
});

describe("zone search", () => {
  const index = [
    { kind: "district", value: "gracia", name: "Gràcia", key: "gracia" },
    {
      kind: "barrio",
      value: "la-vila-de-gracia",
      name: "La Vila de Gràcia",
      key: "la vila de gracia gracia",
    },
    { kind: "barrio", value: "el-clot", name: "El Clot", key: "el clot sant marti" },
  ] as const;

  it("ignores accents and case, best match first, districts win ties", () => {
    expect(searchZones(index, "GRACIA").map((r) => r.value)).toEqual([
      "gracia",
      "la-vila-de-gracia",
    ]);
    expect(searchZones(index, "clot").map((r) => r.value)).toEqual(["el-clot"]);
  });

  it("returns nothing for an empty query and requires every word", () => {
    expect(searchZones(index, "   ")).toEqual([]);
    expect(searchZones(index, "clot gracia")).toEqual([]);
  });
});

describe("step validation (one shared rule set)", () => {
  const ok = {
    operation: "venta",
    priceMin: null,
    priceMax: null,
    areaMin: null,
    areaMax: null,
    name: "Ana",
    email: "ana@example.com",
    phone: "+34 613 084 804",
    consentData: true,
    commercial: false,
    channels: [],
  };

  it("lists the fields to check at each step", () => {
    expect(stepFields(0)).toEqual(["operation"]);
    expect(stepFields(1)).toEqual([]);
    expect(stepFields(2)).toEqual(["price"]);
    expect(stepFields(3)).toEqual(["area"]);
    expect(stepFields(4)).toEqual(["name", "email", "phone", "consentData", "channels"]);
  });

  it("accepts a complete valid search", () => {
    expect(invalidFields(ok, [0, 1, 2, 3, 4])).toEqual([]);
  });

  it("requires the operation and a sane range", () => {
    expect(invalidFields({ ...ok, operation: "" }, [0])).toEqual(["operation"]);
    expect(invalidFields({ ...ok, priceMin: 700000, priceMax: 600000 }, [2])).toEqual(["price"]);
    expect(invalidFields({ ...ok, areaMin: 120, areaMax: 70 }, [3])).toEqual(["area"]);
  });

  it("checks the contact data and the commercial channel dependency", () => {
    expect(
      invalidFields({ ...ok, name: "A", email: "x", phone: "12", consentData: false }, [4]),
    ).toEqual(["name", "email", "phone", "consentData"]);
    expect(invalidFields({ ...ok, commercial: true }, [4])).toEqual(["channels"]);
    expect(invalidFields({ ...ok, commercial: true, channels: ["email"] }, [4])).toEqual([]);
  });
});
