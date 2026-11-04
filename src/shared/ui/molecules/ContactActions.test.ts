import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";
import ContactActions from "./ContactActions.astro";

let container: AstroContainer;

beforeAll(async () => {
  container = await AstroContainer.create();
});

const render = (variant: "drawer" | "footer" | "bar", locale: "es" | "en" = "es") =>
  container.renderToString(ContactActions, { props: { locale, variant } });

describe("ContactActions", () => {
  it.each(["drawer", "footer", "bar"] as const)(
    "offers call, WhatsApp, email and tell us (%s), as proposal v3",
    async (variant) => {
      const html = await render(variant);
      expect(html).toContain('href="tel:+34613084804"');
      expect(html).toContain("https://wa.me/34613084804");
      expect(html).toContain('href="mailto:info@housyspace.com"');
      expect(html).toContain('href="/es/contacto"');
      for (const label of [">Llamar<", ">Email<", "Cuéntanos"]) expect(html).toContain(label);
    },
  );

  it("adds the Instagram and LinkedIn links only in the footer", async () => {
    const footer = await render("footer");
    expect(footer).toContain('href="https://www.instagram.com/housyspace/"');
    expect(footer).toContain(
      'href="https://es.linkedin.com/in/housyspace-property-solution-51b53226a"',
    );
    expect(footer).toContain("HousySpace en Instagram");
    expect(await render("bar")).not.toContain("instagram.com");
    expect(await render("drawer")).not.toContain("instagram.com");
  });

  it("translates the labels", async () => {
    const html = await render("footer", "en");
    expect(html).toContain(">Call<");
    expect(html).toContain("Tell us");
    expect(html).toContain('href="/en/contact"');
    expect(html).toContain("HousySpace on LinkedIn");
  });
});
