import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";
import NewsletterForm from "./NewsletterForm.astro";

let container: AstroContainer;

beforeAll(async () => {
  container = await AstroContainer.create();
});

describe("NewsletterForm", () => {
  it("prepares the subscription email as a lead form until a newsletter tool exists (I3)", async () => {
    const html = await container.renderToString(NewsletterForm, { props: { locale: "es" } });
    expect(html).toContain("data-lead-form");
    expect(html).toContain('data-mode="email"');
    expect(html).toContain('data-target="mailto:info@housyspace.com"');
    expect(html).toContain('data-subject="Alta en la newsletter"');
    expect(html).toContain("Newsletter y artículos");
    expect(html).toMatch(/<input[^>]*type="email"[^>]*required/);
    expect(html).toMatch(/<input[^>]*type="checkbox"[^>]*required/);
    expect(html).toContain('href="/es/privacidad"');
    expect(html).toContain('href="mailto:info@housyspace.com"');
    expect(html).toContain("Información básica sobre protección de datos");
    expect(html).toMatch(/<button type="submit"[^>]*>[\s\S]*Suscribirme/);
  });

  it("labels the email field for screen readers and translates the copy", async () => {
    const html = await container.renderToString(NewsletterForm, { props: { locale: "en" } });
    expect(html).toMatch(/<label[^>]*>\s*<span class="sr-only">Email address<\/span>/);
    expect(html).toContain("Newsletter and articles");
    expect(html).toContain('href="/en/privacy-policy"');
  });
});
