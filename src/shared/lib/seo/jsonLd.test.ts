import { describe, expect, it } from "vitest";
import { serializeJsonLd } from "./jsonLd";

describe("serializeJsonLd", () => {
  it("returns valid JSON that round-trips", () => {
    const data = { "@context": "https://schema.org", "@type": "Thing", name: "Àtic «Gràcia»" };
    expect(JSON.parse(serializeJsonLd(data))).toEqual(data);
  });

  it("cannot close the surrounding script element", () => {
    const output = serializeJsonLd({ name: "</script><script>alert(1)</script>" });
    expect(output).not.toContain("<");
    expect(output).not.toContain(">");
    expect(JSON.parse(output)).toEqual({ name: "</script><script>alert(1)</script>" });
  });

  it("escapes line separators that break inline scripts in old engines", () => {
    const output = serializeJsonLd({ name: "a\u2028b\u2029c&d" });
    expect(output).not.toMatch(/[\u2028\u2029&]/);
    expect(JSON.parse(output)).toEqual({ name: "a\u2028b\u2029c&d" });
  });
});
