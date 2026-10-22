import { describe, expect, it } from "vitest";
import { htmlToPlainText } from "./htmlToPlainText";

describe("htmlToPlainText", () => {
  it("turns square/cubic metre superscripts into symbols", () => {
    expect(htmlToPlainText("80 m<sup>2</sup> y 3 m<sup>3</sup>")).toBe("80 m² y 3 m³");
  });

  it("keeps paragraphs and line breaks as newlines", () => {
    expect(htmlToPlainText("<p>Uno<br>dos</p><p>Tres</p>")).toBe("Uno\ndos\n\nTres");
  });

  it("removes every other tag and drops script/style contents", () => {
    expect(htmlToPlainText('<b>Hola</b> <a href="x">mundo</a><script>alert(1)</script>')).toBe(
      "Hola mundo",
    );
  });

  it("decodes named and numeric entities", () => {
    expect(htmlToPlainText("Ca&ntilde;a &amp; jard&iacute;n&nbsp;50&#8364; &#x27;ok&#x27;")).toBe(
      "Caña & jardín 50€ 'ok'",
    );
  });

  it("collapses whitespace and trims", () => {
    expect(htmlToPlainText("  <p>  a   b  </p>\n\n\n<p>c</p> ")).toBe("a b\n\nc");
  });
});
