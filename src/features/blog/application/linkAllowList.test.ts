import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { marketSchema } from "@/features/districts/infrastructure/marketSchema";
import { buildLinkAllowList, classifyHref } from "./linkAllowList";

const market = marketSchema.parse(
  JSON.parse(readFileSync("src/content/market/barcelona.json", "utf8")),
);
const links = buildLinkAllowList({ market, articleSlugs: ["cuanto-vale-mi-piso"] });
const district = market.districts[0];
const barrio = market.barrios[0];

describe("buildLinkAllowList", () => {
  it("resolves fixed pages in every locale", () => {
    expect(links.resolve("/es/contacto")?.kind).toBe("page");
    expect(links.resolve("/en/valuation")?.kind).toBe("page");
    expect(links.resolve("/it/contatti")?.kind).toBe("page");
    expect(links.resolve("/ca/blog")?.kind).toBe("page");
  });

  it("classifies services and resolves their detail pages", () => {
    expect(links.resolve("/es/servicios")?.kind).toBe("service");
    expect(links.resolve("/es/servicios/valoracion")?.kind).toBe("service");
    expect(links.resolve("/en/services/property-sales-brokerage")?.kind).toBe("service");
  });

  it("resolves zones from the market collection", () => {
    expect(links.resolve("/es/zonas/barcelona")?.kind).toBe("zone");
    expect(links.resolve(`/es/zonas/barcelona/distritos/${district?.slug}`)?.kind).toBe("zone");
    expect(links.resolve(`/ca/zones/barcelona/${barrio?.slug}`)?.kind).toBe("zone");
  });

  it("resolves other articles by slug only", () => {
    expect(links.resolve("/es/blog/cuanto-vale-mi-piso")).toMatchObject({
      kind: "article",
      slug: "cuanto-vale-mi-piso",
    });
    expect(links.resolve("/es/blog/no-existe")).toBeUndefined();
  });

  it("rejects routes that do not exist, wrong segments and a retired living path", () => {
    expect(links.resolve("/es/servicios/inventado")).toBeUndefined();
    expect(links.resolve("/es/services")).toBeUndefined();
    expect(links.resolve("/es/zonas/barcelona/inventado")).toBeUndefined();
    expect(links.resolve("/es/zonas/barcelona/distritos/inventado")).toBeUndefined();
    expect(links.resolve("/contacto")).toBeUndefined();
  });
});

describe("classifyHref", () => {
  it("normalizes query, fragment and trailing slash of internal links", () => {
    expect(classifyHref("/es/contacto/?a=1#form")).toEqual({
      kind: "internal",
      path: "/es/contacto",
    });
  });

  it("treats other hosts as external and own-domain absolute links as internal", () => {
    expect(classifyHref("https://www.boe.es/x")).toEqual({ kind: "external" });
    expect(classifyHref("https://www.housyspace.com/es/contacto")).toEqual({
      kind: "internal",
      path: "/es/contacto",
    });
  });

  it("ignores anchors, mailto and tel, and flags relative paths", () => {
    expect(classifyHref("#fuentes")).toEqual({ kind: "ignored" });
    expect(classifyHref("mailto:a@b.es")).toEqual({ kind: "ignored" });
    expect(classifyHref("tel:+34900")).toEqual({ kind: "ignored" });
    expect(classifyHref("contacto")).toEqual({ kind: "relative" });
  });
});
