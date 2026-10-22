import { describe, expect, it } from "vitest";
import { formatMessage, formatNumber, formatPrice } from "./format";

/** Intl uses (narrow) no-break spaces; normalize them for readable assertions. */
const plain = (value: string) => value.replace(/[\u00a0\u202f]/g, " ");

describe("formatPrice", () => {
  it("formats euros without decimals per locale", () => {
    expect(plain(formatPrice(339000, "es"))).toBe("339.000 €");
    expect(plain(formatPrice(339000, "en"))).toBe("€339,000");
    expect(plain(formatPrice(339000, "it"))).toBe("339.000 €");
    expect(plain(formatPrice(339000, "ca"))).toBe("339.000 €");
  });

  it("rounds to whole euros", () => {
    expect(plain(formatPrice(899.6, "es"))).toBe("900 €");
  });
});

describe("formatNumber", () => {
  it("uses the locale's separators", () => {
    expect(formatNumber(12500, "es")).toBe("12.500");
    expect(formatNumber(12500, "en")).toBe("12,500");
  });
});

describe("formatMessage", () => {
  it("replaces named placeholders", () => {
    expect(formatMessage("Distrito · {count} barrios", { count: 6 })).toBe("Distrito · 6 barrios");
    expect(formatMessage("{a} y {b}", { a: "uno", b: "dos" })).toBe("uno y dos");
  });

  it("throws when a placeholder has no value", () => {
    expect(() => formatMessage("Hola {name}", {})).toThrow(RangeError);
  });
});
