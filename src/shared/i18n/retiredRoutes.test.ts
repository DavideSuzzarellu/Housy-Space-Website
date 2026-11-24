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
});
