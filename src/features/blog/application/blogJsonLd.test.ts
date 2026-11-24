import { describe, expect, it } from "vitest";
import { COMPANY } from "@/features/agency/domain/company";
import type { BlogPost } from "./posts";
import { buildBlogJsonLd } from "./blogJsonLd";

function post(data: Record<string, unknown> = {}): BlogPost {
  // Only the frontmatter fields the builder reads: a partial entry stands in for the collection's.
  return {
    id: "cuanto-vale-mi-piso",
    data: {
      title: "Cuánto vale mi piso en Barcelona",
      description: "Descripción del artículo.",
      date: new Date("2026-12-01"),
      category: "valoracion",
      language: "es",
      image: { src: "/_astro/foto.webp" },
      imageAlt: "Vista",
      keyword: "cuanto vale mi piso",
      secondaryKeywords: ["valoración piso", "precio de venta"],
      ...data,
    },
  } as unknown as BlogPost;
}

const INPUT = {
  url: "https://www.housyspace.com/es/blog/cuanto-vale-mi-piso",
  siteUrl: "https://www.housyspace.com/",
  company: COMPANY,
};

describe("buildBlogJsonLd", () => {
  it("describes the article with the SEO fields", () => {
    expect(buildBlogJsonLd({ ...INPUT, post: post() })).toMatchObject({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: "Cuánto vale mi piso en Barcelona",
      datePublished: "2026-12-01T00:00:00.000Z",
      inLanguage: "es-ES",
      articleSection: "Valoración",
      keywords: "cuanto vale mi piso, valoración piso, precio de venta",
      mainEntityOfPage: { "@type": "WebPage", "@id": INPUT.url },
    });
  });

  it("names the category in the article's own language", () => {
    const data = buildBlogJsonLd({ ...INPUT, post: post({ language: "en" }) });
    expect(data["articleSection"]).toBe("Valuation");
    expect(data["inLanguage"]).toBe("en");
  });

  it("uses the organization as publisher and, without author, as author", () => {
    const data = buildBlogJsonLd({ ...INPUT, post: post() });
    expect(data["publisher"]).toMatchObject({
      "@type": "RealEstateAgent",
      name: COMPANY.legalName,
    });
    expect(data["author"]).toEqual(data["publisher"]);
    expect(buildBlogJsonLd({ ...INPUT, post: post({ author: "Ana Ruiz" }) })["author"]).toEqual({
      "@type": "Person",
      name: "Ana Ruiz",
    });
  });

  it("adds dateModified only from a real updatedAt and never emits FAQPage", () => {
    expect(buildBlogJsonLd({ ...INPUT, post: post() })).not.toHaveProperty("dateModified");
    const data = buildBlogJsonLd({ ...INPUT, post: post({ updatedAt: new Date("2027-01-15") }) });
    expect(data["dateModified"]).toBe("2027-01-15T00:00:00.000Z");
    expect(JSON.stringify(data)).not.toContain("FAQPage");
  });
});
