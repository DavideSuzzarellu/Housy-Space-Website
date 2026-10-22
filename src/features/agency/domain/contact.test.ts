import { describe, expect, it } from "vitest";
import { CONTACT_PHONE, phoneDisplay, telHref, whatsappHref } from "./contact";

describe("contact channels", () => {
  it("builds the tap-to-call link in E.164", () => {
    expect(telHref(CONTACT_PHONE)).toBe("tel:+34613084804");
  });

  it("displays the national number in groups of three", () => {
    expect(phoneDisplay(CONTACT_PHONE)).toBe("613 084 804");
  });

  it("builds a WhatsApp link with an optional URL-encoded message", () => {
    expect(whatsappHref(CONTACT_PHONE)).toBe("https://wa.me/34613084804");
    expect(whatsappHref(CONTACT_PHONE, "Hola, me gustaría información.")).toBe(
      "https://wa.me/34613084804?text=Hola%2C+me+gustar%C3%ADa+informaci%C3%B3n.",
    );
  });
});
