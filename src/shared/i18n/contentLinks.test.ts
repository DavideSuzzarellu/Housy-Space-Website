import { describe, expect, it } from "vitest";
import { resolveContentHref } from "./contentLinks";

describe("resolveContentHref", () => {
  it("resolves routes, services and districts per locale", () => {
    expect(resolveContentHref("route:contact", "en")).toBe("/en/contact");
    expect(resolveContentHref("service:valoracion", "es")).toBe("/es/servicios/valoracion");
    expect(resolveContentHref("district:gracia", "it")).toBe("/it/vivere-a-barcellona/gracia");
  });

  it("keeps the fragment", () => {
    expect(resolveContentHref("route:about#filosofia", "es")).toBe("/es/nosotros#filosofia");
  });

  it("passes external and same-page targets through", () => {
    expect(resolveContentHref("tel:+34613084804", "es")).toBe("tel:+34613084804");
    expect(resolveContentHref("#formulario", "es")).toBe("#formulario");
  });

  it("fails on an unknown internal target", () => {
    expect(() => resolveContentHref("route:nope", "es")).toThrow();
    expect(() => resolveContentHref("service:nope", "es")).toThrow();
  });
});
