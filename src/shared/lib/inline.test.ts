import { describe, expect, it } from "vitest";
import { parseInline, plainInline } from "./inline";

describe("parseInline", () => {
  it("splits text, bold and links in order", () => {
    expect(parseInline("Hola **mundo** y [ver](route:contact) fin")).toEqual([
      { type: "text", text: "Hola " },
      { type: "strong", text: "mundo" },
      { type: "text", text: " y " },
      { type: "link", text: "ver", target: "route:contact" },
      { type: "text", text: " fin" },
    ]);
  });

  it("leaves text without markup untouched, including unclosed markers", () => {
    expect(parseInline("sin **cerrar")).toEqual([{ type: "text", text: "sin **cerrar" }]);
  });
});

describe("plainInline", () => {
  it("drops the markup and keeps the words", () => {
    expect(plainInline("**Sí** a la [privacidad](route:privacy).")).toBe("Sí a la privacidad.");
  });
});
