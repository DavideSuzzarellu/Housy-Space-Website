import { describe, expect, it } from "vitest";
import {
  propertyTransitionName,
  propertyTransitionNames,
  SITE_HEADER_TRANSITION_NAME,
  sharedMorphRefs,
} from "./transitionNames";

describe("propertyTransitionName", () => {
  it("builds a deterministic name per ref and part", () => {
    expect(propertyTransitionName("HS1234", "image")).toBe("property-hs1234-image");
    expect(propertyTransitionName("HS1234", "image")).toBe(
      propertyTransitionName("HS1234", "image"),
    );
  });

  it("gives each part of the same property a different name", () => {
    const names = new Set(
      (["image", "title", "price"] as const).map((part) => propertyTransitionName("A1", part)),
    );
    expect(names.size).toBe(3);
  });

  it("gives different refs different names", () => {
    expect(propertyTransitionName("A1", "title")).not.toBe(propertyTransitionName("A2", "title"));
  });

  it("only returns characters valid in a CSS identifier", () => {
    const name = propertyTransitionName("Ref 12/Á.b", "price");
    expect(name).toMatch(/^[a-z][a-z0-9-]*$/);
    expect(name).toBe("property-ref-12-a-b-price");
  });

  it("rejects a ref with no usable characters", () => {
    expect(() => propertyTransitionName("  ", "image")).toThrow(RangeError);
  });
});

describe("propertyTransitionNames", () => {
  it("returns the three morph names of one property", () => {
    expect(propertyTransitionNames("A1")).toEqual({
      image: "property-a1-image",
      title: "property-a1-title",
      price: "property-a1-price",
    });
  });
});

describe("sharedMorphRefs", () => {
  it("keeps only refs present on both pages, normalized like the names", () => {
    expect([...sharedMorphRefs(["1001", "HS-2"], ["hs-2", "1003"])]).toEqual(["hs-2"]);
    expect(sharedMorphRefs(["1001"], ["1002"]).size).toBe(0);
  });
});

describe("SITE_HEADER_TRANSITION_NAME", () => {
  it("never collides with property names", () => {
    expect(SITE_HEADER_TRANSITION_NAME).toMatch(/^[a-z][a-z-]*$/);
    expect(SITE_HEADER_TRANSITION_NAME.startsWith("property-")).toBe(false);
  });
});
