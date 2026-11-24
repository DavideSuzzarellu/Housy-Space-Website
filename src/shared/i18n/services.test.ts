import { describe, expect, it } from "vitest";
import { LOCALES } from "./config";
import { getServiceKeyBySlug, getServiceSlug, SERVICE_KEYS } from "./services";

describe("service slugs", () => {
  it("keeps the Spanish slugs and translates the other locales", () => {
    expect(getServiceSlug("saleBrokerage", "es")).toBe("venta-estrategica");
    expect(getServiceSlug("saleBrokerage", "en")).toBe("property-sales-brokerage");
    expect(getServiceSlug("valuation", "it")).toBe("valutazione-immobiliare");
    expect(getServiceSlug("renovations", "ca")).toBe("reformes-interiorisme");
  });

  it.each(LOCALES)("are SEO-clean and unique in %s", (locale) => {
    const slugs = SERVICE_KEYS.map((service) => getServiceSlug(service, locale));
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    expect(new Set(slugs).size).toBe(SERVICE_KEYS.length);
  });

  it("resolves content links by the Spanish slug whatever the page locale", () => {
    expect(getServiceKeyBySlug("valoracion")).toBe("valuation");
    expect(getServiceKeyBySlug("property-valuation")).toBeUndefined();
  });
});
