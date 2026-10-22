import { describe, expect, it } from "vitest";
import { COMPANY } from "@/features/agency/domain/company";
import { toAreaM2 } from "../domain/property";
import { amount, approximateIn, makeProperty } from "../testing/makeProperty";
import { buildPropertyJsonLd } from "./propertyJsonLd";

const SITE = "https://www.housyspace.com";
const URL_ES = `${SITE}/es/venta/piso-en-el-clot-1001`;

const property = makeProperty("1001", {
  title: { es: "Piso en El Clot" },
  summary: { es: "Piso luminoso con balcón." },
  propertyType: { es: "Pisos" },
  prices: { sale: amount(339000), rent: amount(1500) },
  operations: ["sale", "rent"],
  builtArea: toAreaM2(80),
  bedrooms: 3,
  bathrooms: 1,
  location: approximateIn("El Clot"),
  photos: [
    { url: "https://media.mobiliagestion.es/Portals/1/a.jpg", caption: {} },
    { url: "https://media.mobiliagestion.es/Portals/1/b.jpg", caption: {} },
  ],
});

function build(overrides: Partial<Parameters<typeof buildPropertyJsonLd>[0]> = {}) {
  return buildPropertyJsonLd({
    property,
    operation: "sale",
    locale: "es",
    url: URL_ES,
    siteUrl: SITE,
    company: COMPANY,
    ...overrides,
  });
}

type Node = Record<string, unknown>;
function nodeOfType(graph: unknown, type: string): Node {
  if (typeof graph !== "object" || graph === null || !("@graph" in graph)) throw new Error("graph");
  const nodes = graph["@graph"];
  if (!Array.isArray(nodes)) throw new Error("graph nodes");
  const node: unknown = nodes.find(
    (candidate: unknown) =>
      typeof candidate === "object" &&
      candidate !== null &&
      "@type" in candidate &&
      candidate["@type"] === type,
  );
  if (typeof node !== "object" || node === null) throw new Error(`no ${type}`);
  return Object.fromEntries(Object.entries(node));
}

describe("buildPropertyJsonLd", () => {
  it("describes the dwelling as an Apartment with localized name, photos and facts", () => {
    const residence = nodeOfType(build(), "Apartment");
    expect(residence).toMatchObject({
      "@id": `${URL_ES}#property`,
      name: "Piso en El Clot",
      description: "Piso luminoso con balcón.",
      url: URL_ES,
      image: [
        "https://media.mobiliagestion.es/Portals/1/a.jpg",
        "https://media.mobiliagestion.es/Portals/1/b.jpg",
      ],
      numberOfBedrooms: 3,
      numberOfBathroomsTotal: 1,
      floorSize: { "@type": "QuantitativeValue", value: 80, unitCode: "MTK" },
      address: { "@type": "PostalAddress", addressLocality: "Barcelona", addressCountry: "ES" },
    });
  });

  it("never exposes coordinates or a street address", () => {
    const json = JSON.stringify(nodeOfType(build(), "Apartment"));
    expect(json).not.toContain("geo");
    expect(json).not.toContain("streetAddress");
    expect(json).not.toContain("41.4");
  });

  it("falls back to the generic Residence type for non-apartment types", () => {
    const house = makeProperty("2", { propertyType: { es: "Casas" } });
    expect(() => nodeOfType(build({ property: house }), "Residence")).not.toThrow();
  });

  it("adds an Offer in EUR with the operation price, availability and the agency as seller", () => {
    const offer = nodeOfType(build(), "Offer");
    expect(offer).toMatchObject({
      price: 339000,
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      url: URL_ES,
      itemOffered: { "@id": `${URL_ES}#property` },
      seller: {
        "@type": "RealEstateAgent",
        name: COMPANY.legalName,
        url: SITE,
        address: {
          "@type": "PostalAddress",
          streetAddress: COMPANY.address.street,
          postalCode: COMPANY.address.postalCode,
          addressLocality: COMPANY.address.city,
          addressCountry: "ES",
        },
      },
    });
  });

  it("prices rentals per month", () => {
    const offer = nodeOfType(build({ operation: "rent" }), "Offer");
    expect(offer).toMatchObject({
      price: 1500,
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: 1500,
        priceCurrency: "EUR",
        unitCode: "MON",
      },
    });
  });

  it("omits the price when it is on request and flags reserved listings", () => {
    const offer = nodeOfType(
      build({
        property: { ...property, status: "reserved", prices: { sale: { kind: "onRequest" } } },
      }),
      "Offer",
    );
    expect(offer).not.toHaveProperty("price");
    expect(offer).not.toHaveProperty("priceCurrency");
    expect(offer["availability"]).toBe("https://schema.org/LimitedAvailability");
  });
});
