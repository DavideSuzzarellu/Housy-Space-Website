import { describe, expect, it } from "vitest";
import { invalidFields, type FormValues } from "../domain/searchWizard";
import { searchFormSchema } from "./searchFormSchema";

const base: FormValues = {
  operation: "venta",
  priceMin: null,
  priceMax: null,
  areaMin: null,
  areaMax: null,
  name: "Ana",
  email: "ana@example.com",
  phone: "+34 613 084 804",
  consentData: true,
  commercial: false,
  channels: [],
};

/** Variations of one field around its limits, each applied to a valid request. */
const variants: Partial<FormValues>[] = [
  {},
  { operation: "" },
  { operation: "alquiler" },
  { priceMin: 300000, priceMax: 650000 },
  { priceMin: 650000, priceMax: 300000 },
  { priceMin: 500, priceMax: 500 },
  { priceMax: 1800 },
  { areaMin: 70, areaMax: 120 },
  { areaMin: 121, areaMax: 120 },
  { name: "" },
  { name: "A" },
  { name: " Al " },
  { email: "" },
  { email: "ana@example" },
  { email: "ana@example.c" },
  { email: "a b@example.com" },
  { email: " ana@example.com " },
  { phone: "" },
  { phone: "12345678" },
  { phone: "123456789" },
  { phone: "+34 (613) 084-804" },
  { phone: "1234567890123456" },
  { phone: "123456789012345" },
  { phone: "abc123456789" },
  { consentData: false },
  { commercial: true },
  { commercial: true, channels: ["email"] },
  { commercial: false, channels: ["email"] },
];

describe("client rules and server schema", () => {
  it.each(variants.map((v) => [JSON.stringify(v), v] as const))(
    "agree on %s",
    (_label, variant) => {
      const values: FormValues = { ...base, ...variant };
      const clientOk = invalidFields(values, [0, 1, 2, 3, 4]).length === 0;
      expect(searchFormSchema.safeParse(values).success).toBe(clientOk);
    },
  );

  it("agree on every pair of single failures too", () => {
    for (const a of variants) {
      for (const b of variants) {
        const values: FormValues = { ...base, ...a, ...b };
        const clientOk = invalidFields(values, [0, 1, 2, 3, 4]).length === 0;
        expect(searchFormSchema.safeParse(values).success, JSON.stringify(values)).toBe(clientOk);
      }
    }
  });
});
