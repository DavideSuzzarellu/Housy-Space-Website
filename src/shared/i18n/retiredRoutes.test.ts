import { describe, expect, it } from "vitest";
import { getRetiredRedirects } from "./retiredRoutes";

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
