import { describe, expect, it } from "vitest";
import { buildLeadMessage, mailtoHref } from "./leadMessage";

describe("buildLeadMessage", () => {
  it("lists the answered fields after the intro and skips empty ones", () => {
    expect(
      buildLeadMessage("Hola.", [
        { label: "Nombre", value: " Ana " },
        { label: "Email", value: "  " },
      ]),
    ).toBe("Hola.\nNombre: Ana");
  });

  it("works without an intro", () => {
    expect(buildLeadMessage(undefined, [{ label: "Zona", value: "Gràcia" }])).toBe("Zona: Gràcia");
  });
});

describe("mailtoHref", () => {
  it("encodes spaces as %20, not +", () => {
    expect(mailtoHref("a@b.es", "Hola mundo", "x y")).toBe(
      "mailto:a@b.es?subject=Hola%20mundo&body=x%20y",
    );
  });
});
