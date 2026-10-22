import { describe, expect, it } from "vitest";
import inmueblesFixture from "../../../../../tests/fixtures/mobilia/inmuebles.json";
import { isPublishable, mapInmueble, stripTrackingParams } from "./mapper";
import { mobiliaInmuebleSchema, type MobiliaInmueble } from "./schemas";

const rawItems: readonly unknown[] = inmueblesFixture.elementos;

function rawByRef(ref: string): Record<string, unknown> {
  const item = rawItems.find(
    (candidate): candidate is Record<string, unknown> =>
      typeof candidate === "object" &&
      candidate !== null &&
      "referencia" in candidate &&
      candidate.referencia === ref,
  );
  if (item === undefined) throw new Error(`fixture ${ref} missing`);
  return item;
}

function parsed(ref: string, overrides: Record<string, unknown> = {}): MobiliaInmueble {
  return mobiliaInmuebleSchema.parse({ ...rawByRef(ref), ...overrides });
}

describe("mobiliaInmuebleSchema", () => {
  it("parses every recorded inmueble", () => {
    for (const item of rawItems) {
      expect(mobiliaInmuebleSchema.safeParse(item).success).toBe(true);
    }
  });

  it("strips private fields at the boundary", () => {
    const result = mobiliaInmuebleSchema.parse({
      ...rawByRef("1001"),
      direccionPrivada: "Carrer Privat 1",
      referenciaCatastral: "1234567DF3813C0001XX",
      archivos: [{ url: "https://example.com/contract.pdf" }],
    });
    const json = JSON.stringify(result);
    expect(json).not.toContain("Carrer Privat");
    expect(json).not.toContain("referenciaCatastral");
    expect(json).not.toContain("contract.pdf");
    // Exact location fields are never read either (AGENTS.md §5: maps are always approximate).
    expect(json).not.toContain("Exemple");
    expect(json).not.toContain('"latitud"');
    expect(json).not.toContain('"longitud"');
  });

  it("accepts null for nullable fields", () => {
    expect(
      mobiliaInmuebleSchema.safeParse({ ...rawByRef("1001"), precioVenta: null, fotos: null })
        .success,
    ).toBe(true);
  });
});

describe("isPublishable", () => {
  it("requires publicarEnWeb and activo", () => {
    expect(isPublishable(parsed("1001"))).toBe(true);
    expect(isPublishable(parsed("1001", { publicarEnWeb: false }))).toBe(false);
    expect(isPublishable(parsed("1001", { activo: false }))).toBe(false);
    expect(isPublishable(parsed("1001", { activo: null }))).toBe(false);
  });
});

describe("mapInmueble", () => {
  it("maps a sale listing to the domain shape", () => {
    const property = mapInmueble(parsed("1001"));
    expect(property.ref).toBe("1001");
    expect(property.operations).toEqual(["sale"]);
    expect(property.prices).toEqual({ sale: { kind: "amount", amount: 339000 } });
    expect(property.status).toBe("available");
    expect(property.featured).toBe(true);
    expect(property.builtArea).toBe(80);
    expect(property.bedrooms).toBe(3);
    expect(property.bathrooms).toBe(1);
    expect(property.energyRating).toEqual({ kind: "grade", grade: "E" });
    expect(property.emissionsRating).toEqual({ kind: "grade", grade: "E" });
    expect(property.features).toEqual(expect.arrayContaining(["lift", "terrace", "exterior"]));
    expect(property.features).not.toContain("airConditioning");
    expect(property.agentId).toBe(5754280);
    expect(property.updatedAt).toBe("2026-10-20T15:01:55.543Z");
  });

  it("maps a rent listing", () => {
    const property = mapInmueble(parsed("1004"));
    expect(property.operations).toEqual(["rent"]);
    expect(property.prices).toEqual({ rent: { kind: "amount", amount: 900 } });
    expect(property.toilets).toBe(1);
  });

  it("maps a pending energy certificate", () => {
    const property = mapInmueble(parsed("1003"));
    expect(property.energyRating).toEqual({ kind: "pending" });
    expect(property.features).toEqual(expect.arrayContaining(["airConditioning", "communalPool"]));
  });

  it("maps the floor label and drops an empty one", () => {
    expect(mapInmueble(parsed("1001")).floor).toBe("5");
    expect(mapInmueble(parsed("1002")).floor).toBeUndefined();
    expect(mapInmueble(parsed("1001", { planta: null })).floor).toBeUndefined();
  });

  it("marks reserved listings", () => {
    expect(mapInmueble(parsed("1001", { reservado: true })).status).toBe("reserved");
  });

  it("respects price on request", () => {
    const property = mapInmueble(parsed("1001", { precioVentaAConsultar: true }));
    expect(property.prices).toEqual({ sale: { kind: "onRequest" } });
  });

  it("supports listings for both sale and rent", () => {
    const property = mapInmueble(parsed("1001", { alquiler: true, precioAlquiler: 1500 }));
    expect(property.operations).toEqual(["sale", "rent"]);
    expect(property.prices.rent).toEqual({ kind: "amount", amount: 1500 });
  });

  it("flattens locales to es/en/it/ca and strips HTML", () => {
    const property = mapInmueble(parsed("1001"));
    expect(property.summary.es).toBe(
      "Piso en venta en Barcelona, con 80 m², 3 habitaciones y 1 baños y Ascensor.",
    );
    expect(property.summary.ca).toContain("Pis en venda a Barcelona");
    expect(property.summary.en).toContain("Flat for sale in Barcelona");
    expect(property.summary.it).toBeUndefined();
    expect(property.description.es).not.toMatch(/<[a-z]/i);
    expect(property.propertyType).toEqual({
      es: "Pisos",
      en: "Flats",
      it: "Appartamenti Familiari",
      ca: "Pisos",
    });
  });

  it("maps web titles when Mobilia provides them", () => {
    const property = mapInmueble(
      parsed("1001", { tituloWeb: { txtTituloWeb: "Piso en El Clot", txtTituloWebEn: "Flat" } }),
    );
    expect(property.title).toEqual({ es: "Piso en El Clot", en: "Flat" });
  });

  it("always uses the approximate zone, even when Mobilia allows the exact address", () => {
    for (const mostrarDireccionExacta of [false, true]) {
      const property = mapInmueble(
        parsed("1001", { latitud: "41.4000001", longitud: "2.1900001", mostrarDireccionExacta }),
      );
      expect(property.location).toEqual({
        latitude: 41.409,
        longitude: 2.188,
        radiusM: 250,
        zone: "El Clot",
        city: "Barcelona",
      });
      const json = JSON.stringify(property);
      expect(json).not.toContain("41.4000001");
      expect(json).not.toContain("Exemple");
    }
  });

  it("has no location when Mobilia sends no zone, never falling back to exact coordinates", () => {
    const property = mapInmueble(
      parsed("1001", { latitud: "41.4000001", longitud: "2.1900001", latitudZona: null }),
    );
    expect(property.location).toBeUndefined();
  });

  it("orders photos with the highlighted one first and strips tracking params", () => {
    const property = mapInmueble(
      parsed("1001", {
        fotos: [
          { url: "https://media.mobiliagestion.es/Portals/x/2?utm_source=web&w=1", orden: 1 },
          { url: "https://media.mobiliagestion.es/Portals/x/1", orden: 0 },
          { url: "https://media.mobiliagestion.es/Portals/x/3", orden: 2, destacada: true },
          { url: "not a url", orden: 3 },
          { url: null, orden: 4 },
        ],
      }),
    );
    expect(property.photos.map((photo) => photo.url)).toEqual([
      "https://media.mobiliagestion.es/Portals/x/3",
      "https://media.mobiliagestion.es/Portals/x/1",
      "https://media.mobiliagestion.es/Portals/x/2?w=1",
    ]);
  });

  it("hides the year built unless Mobilia allows showing it", () => {
    expect(mapInmueble(parsed("1001")).yearBuilt).toBeUndefined();
    expect(mapInmueble(parsed("1001", { mostrarAntiguedad: true })).yearBuilt).toBe(1970);
  });

  it("keeps the virtual tour URL only when it is a valid https URL", () => {
    expect(
      mapInmueble(parsed("1001", { urlVisitaVirtual: "https://tour.example.com/1" }))
        .virtualTourUrl,
    ).toBe("https://tour.example.com/1");
    expect(
      mapInmueble(parsed("1001", { urlVisitaVirtual: "javascript:alert(1)" })).virtualTourUrl,
    ).toBeUndefined();
  });

  it("lowercases the reference used as id", () => {
    expect(mapInmueble(parsed("1001", { referencia: "HS-77" })).ref).toBe("hs-77");
  });
});

describe("stripTrackingParams", () => {
  it("removes utm_* params and keeps the rest", () => {
    expect(stripTrackingParams("https://a.b/c?utm_medium=x&k=1&UTM_campaign=y")).toBe(
      "https://a.b/c?k=1",
    );
    expect(stripTrackingParams("https://a.b/c?utm_source=x")).toBe("https://a.b/c");
  });
});
