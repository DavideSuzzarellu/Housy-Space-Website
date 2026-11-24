import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";
import PostCta from "./PostCta.astro";
import PostSources from "./PostSources.astro";
import PostToc from "./PostToc.astro";

let container: AstroContainer;
beforeAll(async () => {
  container = await AstroContainer.create();
});

const heading = (slug: string, depth = 2) => ({ slug, text: slug.toUpperCase(), depth });

describe("PostSources", () => {
  it("lists every source with its link and check date", async () => {
    const html = await container.renderToString(PostSources, {
      props: {
        locale: "es",
        sources: [{ label: "BOE", url: "https://www.boe.es/", checkedAt: new Date("2026-11-20") }],
      },
    });
    expect(html).toContain('href="https://www.boe.es/"');
    expect(html).toContain("Fuentes");
    expect(html).toContain("consultada el 20 de noviembre de 2026");
  });

  it("renders nothing without sources", async () => {
    const html = await container.renderToString(PostSources, {
      props: { locale: "es", sources: [] },
    });
    expect(html.trim()).toBe("");
  });
});

describe("PostToc", () => {
  it("lists only H2 headings and needs at least three", async () => {
    const three = await container.renderToString(PostToc, {
      props: {
        locale: "es",
        headings: [heading("a"), heading("b"), heading("c"), heading("d", 3)],
      },
    });
    expect(three).toContain('href="#a"');
    expect(three).not.toContain('href="#d"');
    const two = await container.renderToString(PostToc, {
      props: { locale: "es", headings: [heading("a"), heading("b")] },
    });
    expect(two.trim()).toBe("");
  });
});

describe("PostCta", () => {
  it.each([
    ["valoracion", "/es/valoracion"],
    ["venta", "/es/servicios/venta-estrategica"],
    ["consulta", "/es/contacto"],
  ] as const)("sends the %s objective to %s", async (objective, path) => {
    const html = await container.renderToString(PostCta, { props: { locale: "es", objective } });
    expect(html).toContain(`data-post-cta="${objective}"`);
    expect(html).toContain(`href="${path}"`);
  });
});
