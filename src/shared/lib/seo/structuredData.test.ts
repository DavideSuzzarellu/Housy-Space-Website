import { describe, expect, it } from "vitest";
import { serializeJsonLd, type JsonLdObject } from "./jsonLd";
import {
  buildHomeJsonLd,
  buildPageJsonLd,
  getSiteUrl,
  organizationId,
  toAbsoluteUrl,
  websiteId,
  type SeoCompany,
} from "./structuredData";

const company: SeoCompany = {
  legalName: "HousySpace Consultores Inmobiliarios, S.L.",
  brandName: "HousySpace · Property Solutions",
  taxId: "B26903419",
  aicatNumber: "14032",
  address: { street: "Travessera de Gràcia 73, 2.º 3.ª", postalCode: "08006", city: "Barcelona" },
};
const siteUrl = "https://www.housyspace.com";
const url = `${siteUrl}/es/servicios/valoracion`;
const base = { siteUrl, url, language: "es-ES", name: "Valoración", description: "Texto." };

/** Graph nodes by `@type`. */
function nodes(data: JsonLdObject): JsonLdObject[] {
  const graph = data["@graph"];
  if (!Array.isArray(graph)) throw new Error("no @graph");
  return graph as JsonLdObject[];
}
const typeOf = (node: JsonLdObject): unknown => node["@type"];

describe("site URL helpers", () => {
  it("keeps the deploy base and drops the trailing slash", () => {
    expect(getSiteUrl(new URL("https://h.example"), "/")).toBe("https://h.example");
    expect(getSiteUrl(new URL("https://h.example"), "/repo")).toBe("https://h.example/repo");
    expect(toAbsoluteUrl("/repo/es/x", new URL("https://h.example"))).toBe(
      "https://h.example/repo/es/x",
    );
  });
});

describe("buildHomeJsonLd", () => {
  const data = buildHomeJsonLd({
    siteUrl,
    company,
    logoUrl: `${siteUrl}/brand/logo.png`,
    languages: ["es-ES", "en"],
  });
  const [agency, website] = nodes(data);

  it("describes the agency with confirmed data only", () => {
    expect(typeOf(agency ?? {})).toBe("RealEstateAgent");
    expect(agency?.["@id"]).toBe(organizationId(siteUrl));
    expect(agency).toMatchObject({
      legalName: company.legalName,
      taxID: "B26903419",
      identifier: { name: "AICAT", value: "14032" },
      address: { postalCode: "08006", addressLocality: "Barcelona", addressCountry: "ES" },
    });
    const keys = Object.keys(agency ?? {});
    for (const unconfirmed of ["telephone", "email", "openingHoursSpecification", "sameAs"]) {
      expect(keys).not.toContain(unconfirmed);
    }
    expect(keys).not.toContain("aggregateRating");
    expect(keys).not.toContain("review");
  });

  it("links the website to the agency by id", () => {
    expect(website?.["@id"]).toBe(websiteId(siteUrl));
    expect(website?.publisher).toEqual({ "@id": organizationId(siteUrl) });
    expect(website?.inLanguage).toEqual(["es-ES", "en"]);
  });
});

describe("buildPageJsonLd", () => {
  it("emits the page and its visible breadcrumb trail with ordered positions", () => {
    const data = buildPageJsonLd({
      ...base,
      breadcrumbs: [
        { name: "Inicio", url: `${siteUrl}/es` },
        { name: "Servicios", url: `${siteUrl}/es/servicios` },
        { name: "Valoración", url },
      ],
    });
    const trail = nodes(data).find((node) => typeOf(node) === "BreadcrumbList");
    const items = trail?.itemListElement as JsonLdObject[];
    expect(items.map((item) => item.position)).toEqual([1, 2, 3]);
    expect(items.at(-1)?.item).toBe(url);
    expect(nodes(data)[0]?.breadcrumb).toEqual({ "@id": `${url}#breadcrumb` });
  });

  it("adds a Service only when asked, provided by the agency", () => {
    expect(nodes(buildPageJsonLd(base)).map(typeOf)).toEqual(["WebPage"]);
    const service = nodes(buildPageJsonLd({ ...base, service: { name: "Valoración" } })).find(
      (node) => typeOf(node) === "Service",
    );
    expect(service?.provider).toEqual({ "@id": organizationId(siteUrl) });
  });

  it("adds a FAQPage only with visible questions", () => {
    expect(nodes(buildPageJsonLd({ ...base, faq: [] })).map(typeOf)).toEqual(["WebPage"]);
    const faq = nodes(
      buildPageJsonLd({ ...base, faq: [{ question: "¿Cuánto?", answer: "Depende." }] }),
    ).find((node) => typeOf(node) === "FAQPage");
    expect(faq?.mainEntity).toEqual([
      {
        "@type": "Question",
        name: "¿Cuánto?",
        acceptedAnswer: { "@type": "Answer", text: "Depende." },
      },
    ]);
  });

  it("describes a barrio inside its district and city without coordinates", () => {
    const placeUrl = `${siteUrl}/es/zonas/barcelona/el-fort-pienc`;
    const data = buildPageJsonLd({
      ...base,
      url: placeUrl,
      place: {
        kind: "barrio",
        name: "El Fort Pienc",
        districtName: "Eixample",
        cityName: "Barcelona",
        description: "Texto.",
      },
    });
    const place = nodes(data).find((node) => typeOf(node) === "AdministrativeArea");
    expect(place?.containedInPlace).toEqual({
      "@type": "AdministrativeArea",
      name: "Eixample",
      containedInPlace: { "@type": "City", name: "Barcelona" },
    });
    expect(Object.keys(place ?? {})).not.toContain("geo");
    expect(nodes(data)[0]?.about).toEqual({ "@id": `${placeUrl}#place` });
  });

  it("serializes to JSON that parses back unchanged", () => {
    const data = buildPageJsonLd({ ...base, name: "A <b> & B" });
    expect(JSON.parse(serializeJsonLd(data))).toEqual(JSON.parse(JSON.stringify(data)));
  });
});
