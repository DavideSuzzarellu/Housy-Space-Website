import { describe, expect, it } from "vitest";
import { toAreaM2, toIsoDateTime } from "../domain/property";
import { amount, approximateIn, makeProperty } from "../testing/makeProperty";
import { buildCatalog } from "./catalog";
import { catalogEntriesSchema } from "./catalogEntrySchema";

const properties = [
  makeProperty("a1", {
    title: { es: "Piso con terraza", en: "Flat with terrace" },
    prices: { sale: amount(300000) },
    builtArea: toAreaM2(80),
    propertyType: { es: "Pisos", en: "Flats" },
    location: approximateIn("El Clot"),
    features: ["terrace", "lift"],
    updatedAt: toIsoDateTime("2026-10-02T00:00:00Z"),
  }),
  makeProperty("b2", {
    title: { es: "Ático en Gràcia" },
    operations: ["sale", "rent"],
    prices: { sale: { kind: "onRequest" }, rent: amount(2500) },
    propertyType: { es: "Áticos" },
    location: {
      latitude: 41.403,
      longitude: 2.157,
      radiusM: 300,
      zone: "Gràcia",
      city: "Barcelona",
    },
    features: ["lift"],
    updatedAt: toIsoDateTime("2026-10-05T00:00:00Z"),
  }),
  makeProperty("c3", { operations: ["rent"], prices: { rent: amount(900) } }),
];

const normalize = (value: string): string => value.replace(/[\u00a0\u202f]/g, " ");

describe("buildCatalog", () => {
  it("keeps only the listings of the operation, most recent first", () => {
    expect(buildCatalog(properties, "sale", "es").entries.map((entry) => entry.ref)).toEqual([
      "b2",
      "a1",
    ]);
    expect(buildCatalog(properties, "rent", "es").properties.map((p) => p.ref)).toEqual([
      "b2",
      "c3",
    ]);
  });

  it("presents title, price label and detail link per entry", () => {
    const [onRequest, flat] = buildCatalog(properties, "sale", "es").entries;
    expect(flat).toMatchObject({
      title: "Piso con terraza",
      href: "/es/venta/piso-con-terraza-a1",
    });
    expect(normalize(flat?.priceLabel ?? "")).toBe("300.000 €");
    expect(onRequest?.priceLabel).toBe("Precio a consultar");
    expect(onRequest?.price).toBeUndefined();
    const rent = buildCatalog(properties, "rent", "en").entries[0];
    expect(rent?.priceLabel).toBe("€2,500/month");
    expect(rent?.href).toBe("/en/rent/atico-en-gracia-b2");
  });

  it("passes only the zone centre and radius to the map, never zone or city text", () => {
    const entries = buildCatalog(properties, "sale", "es").entries;
    expect(entries[0]?.location).toEqual({ latitude: 41.403, longitude: 2.157, radiusM: 300 });
    expect(JSON.stringify(entries)).not.toContain("Barcelona");
  });

  it("offers zone, type and feature options present in the listings, sorted by label", () => {
    const { options } = buildCatalog(properties, "sale", "en");
    expect(options.zones).toEqual([
      { value: "el-clot", label: "El Clot" },
      { value: "gracia", label: "Gràcia" },
    ]);
    expect(options.types).toEqual([
      { value: "aticos", label: "Áticos" },
      { value: "pisos", label: "Flats" },
    ]);
    expect(options.features).toEqual([
      { value: "lift", label: "Lift" },
      { value: "terrace", label: "Terrace" },
    ]);
  });

  it("produces a payload the client schema accepts unchanged (JSON round trip)", () => {
    const { entries } = buildCatalog(properties, "sale", "es");
    const payload: unknown = JSON.parse(JSON.stringify(entries));
    expect(catalogEntriesSchema.parse(payload)).toEqual(entries);
  });

  it("rejects a tampered payload", () => {
    const { entries } = buildCatalog(properties, "sale", "es");
    expect(catalogEntriesSchema.safeParse([{ ...entries[0], ref: "" }]).success).toBe(false);
    expect(catalogEntriesSchema.safeParse([{ ...entries[0], href: "javascript:x" }]).success).toBe(
      false,
    );
    expect(catalogEntriesSchema.safeParse({ entries }).success).toBe(false);
  });
});
