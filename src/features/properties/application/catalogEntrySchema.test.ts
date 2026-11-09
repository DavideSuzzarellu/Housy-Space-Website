import { describe, expect, it } from "vitest";
import { hrefPattern } from "./catalogEntrySchema";

describe("hrefPattern", () => {
  it("accepts locale paths without a deploy base", () => {
    expect(hrefPattern("/").test("/es/venta/piso-en-gracia-hs1")).toBe(true);
  });

  it("accepts the same paths under a deploy base", () => {
    const pattern = hrefPattern("/Housy-Space-Website/");
    expect(pattern.test("/Housy-Space-Website/es/venta/piso-en-gracia-hs1")).toBe(true);
  });

  it("rejects external, protocol-relative and base-less paths when a base is set", () => {
    const pattern = hrefPattern("/Housy-Space-Website/");
    expect(pattern.test("https://evil.example/es/venta/x")).toBe(false);
    expect(pattern.test("//evil.example/es/venta/x")).toBe(false);
    expect(pattern.test("/es/venta/x")).toBe(false);
  });
});
