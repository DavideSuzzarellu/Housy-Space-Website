import { describe, expect, it } from "vitest";
import { getRetiredRedirectRules, getRetiredRedirects, renderRedirectRules } from "./retiredRoutes";

describe("getRetiredRedirects", () => {
  const redirects = getRetiredRedirects();

  it("sends the old advisory service to the services index in every locale", () => {
    expect(redirects["/es/servicios/asesoramiento"]).toBe("/es/servicios");
    expect(redirects["/en/services/personalised-advice"]).toBe("/en/services");
    expect(redirects["/it/servizi/consulenza-personalizzata"]).toBe("/it/servizi");
    expect(redirects["/ca/serveis/assessorament-personalitzat"]).toBe("/ca/serveis");
  });

  it("sends the old sell page to the sale brokerage service in every locale", () => {
    expect(redirects["/es/vender"]).toBe("/es/servicios/venta-estrategica");
    expect(redirects["/en/sell"]).toBe("/en/services/property-sales-brokerage");
    expect(redirects["/it/vendere"]).toBe("/it/servizi/compravendita-intermediazione");
    expect(redirects["/ca/vendre"]).toBe("/ca/serveis/compravenda-intermediacio");
  });

  it("sends the old living-in-Barcelona URLs to the zones URLs in every locale", () => {
    expect(redirects["/es/vivir-en-barcelona"]).toBe("/es/zonas/barcelona");
    expect(redirects["/en/living-in-barcelona"]).toBe("/en/zones/barcelona");
    expect(redirects["/it/vivere-a-barcellona"]).toBe("/it/zone/barcelona");
    expect(redirects["/ca/viure-a-barcelona"]).toBe("/ca/zones/barcelona");
    expect(redirects["/es/vivir-en-barcelona/eixample"]).toBe(
      "/es/zonas/barcelona/distritos/eixample",
    );
    expect(redirects["/en/living-in-barcelona/eixample"]).toBe(
      "/en/zones/barcelona/districts/eixample",
    );
    expect(redirects["/it/vivere-a-barcellona/eixample"]).toBe(
      "/it/zone/barcelona/distretti/eixample",
    );
    expect(redirects["/ca/viure-a-barcelona/eixample"]).toBe(
      "/ca/zones/barcelona/districtes/eixample",
    );
    expect(redirects["/es/vivir-en-barcelona/eixample/la-dreta-de-leixample"]).toBe(
      "/es/zonas/barcelona/la-dreta-de-leixample",
    );
    expect(redirects["/ca/viure-a-barcelona/sant-marti/el-poblenou"]).toBe(
      "/ca/zones/barcelona/el-poblenou",
    );
  });

  it("sends the removed province pages to the zones index in every locale", () => {
    expect(redirects["/es/provincia-de-barcelona"]).toBe("/es/zonas/barcelona");
    expect(redirects["/es/provincia-de-barcelona/abrera"]).toBe("/es/zonas/barcelona");
    expect(redirects["/en/barcelona-province/sitges"]).toBe("/en/zones/barcelona");
    expect(redirects["/it/provincia-di-barcellona"]).toBe("/it/zone/barcelona");
    expect(redirects["/ca/provincia-de-barcelona/badalona"]).toBe("/ca/zones/barcelona");
  });
});

describe("custom search", () => {
  it("is folded into My search in every locale", () => {
    const redirects = getRetiredRedirects();
    expect(redirects["/es/busqueda-a-medida"]).toBe("/es/mi-busqueda");
    expect(redirects["/en/property-search-service"]).toBe("/en/my-search");
    expect(redirects["/it/ricerca-su-misura"]).toBe("/it/la-mia-ricerca");
    expect(redirects["/ca/cerca-a-mida"]).toBe("/ca/la-meva-cerca");
  });
});

describe("host redirect rules", () => {
  const rules = getRetiredRedirectRules();

  it("starts with the root redirect and collapses the municipality pages into one splat per locale", () => {
    expect(rules[0]).toEqual({ from: "/", to: "/es", status: 301 });
    const splats = rules.filter((rule) => rule.from.endsWith("/*"));
    expect(splats.map((rule) => rule.from)).toEqual([
      "/es/provincia-de-barcelona/*",
      "/en/barcelona-province/*",
      "/it/provincia-di-barcellona/*",
      "/ca/provincia-de-barcelona/*",
    ]);
    expect(rules.length).toBeLessThan(500);
  });

  it("keeps the old root URLs of the previous site", () => {
    expect(rules).toContainEqual({ from: "/politica-cookies", to: "/es/cookies", status: 301 });
    expect(rules).toContainEqual({ from: "/housyspace", to: "/es/nosotros", status: 301 });
  });

  it("never sends a URL to itself and every source is unique", () => {
    expect(rules.filter((rule) => rule.from === rule.to)).toEqual([]);
    expect(new Set(rules.map((rule) => rule.from)).size).toBe(rules.length);
  });

  it("prefixes the deploy base on both sides", () => {
    const text = renderRedirectRules([{ from: "/", to: "/es", status: 301 }], "/repo/");
    expect(text).toBe("/repo/ /repo/es 301\n");
  });
});

describe("renderRedirectRules (the production `_redirects` file)", () => {
  const lines = renderRedirectRules(getRetiredRedirectRules()).trimEnd().split("\n");

  it("is base-free, starts with the root rule and marks every rule 301", () => {
    expect(lines[0]).toBe("/ /es 301");
    expect(lines.every((line) => /^\/\S* \/\S* 301$/.test(line))).toBe(true);
    expect(lines.join("\n")).not.toContain("Housy-Space-Website");
  });

  it("collapses each old province family into one splat rule", () => {
    expect(lines).toContain("/es/provincia-de-barcelona/* /es/zonas/barcelona 301");
    expect(lines.filter((line) => line.includes("/*"))).toHaveLength(4);
  });

  it("has no duplicated source", () => {
    const sources = lines.map((line) => line.split(" ")[0]);
    expect(new Set(sources).size).toBe(sources.length);
  });
});
