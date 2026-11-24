import { describe, expect, it } from "vitest";
import { COMPANY } from "@/features/agency/domain/company";
import { buildArticleJsonLd, type ArticleJsonLdInput } from "./blogJsonLd";

const INPUT: ArticleJsonLdInput = {
  article: {
    title: "Cuánto vale mi piso en Barcelona",
    seoTitle: undefined,
    description: "Descripción del artículo.",
    date: new Date("2026-12-01"),
    updatedAt: undefined,
    language: "es",
    author: undefined,
    keyword: "cuanto vale mi piso",
    secondaryKeywords: ["valoración piso", "precio de venta"],
  },
  categoryName: "Valoración",
  url: "https://www.housyspace.com/es/blog/cuanto-vale-mi-piso",
  imageUrl: "https://www.housyspace.com/_astro/foto.avif",
  siteUrl: "https://www.housyspace.com/",
  company: COMPANY,
};

describe("buildArticleJsonLd", () => {
  it("describes the article with the SEO fields", () => {
    const data = buildArticleJsonLd(INPUT);
    expect(data).toMatchObject({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Cuánto vale mi piso en Barcelona",
      description: "Descripción del artículo.",
      datePublished: "2026-12-01T00:00:00.000Z",
      inLanguage: "es-ES",
      articleSection: "Valoración",
      keywords: "cuanto vale mi piso, valoración piso, precio de venta",
      image: ["https://www.housyspace.com/_astro/foto.avif"],
      mainEntityOfPage: { "@type": "WebPage", "@id": INPUT.url },
    });
  });

  it("uses the confirmed organization as publisher and, without author, as author", () => {
    const data = buildArticleJsonLd(INPUT);
    expect(data["publisher"]).toMatchObject({
      "@type": "RealEstateAgent",
      name: COMPANY.legalName,
    });
    expect(data["author"]).toEqual(data["publisher"]);
    expect(JSON.stringify(data)).not.toContain("geo");
  });

  it("names a person author when the article has one", () => {
    const data = buildArticleJsonLd({
      ...INPUT,
      article: { ...INPUT.article, author: "Ana Ruiz" },
    });
    expect(data["author"]).toEqual({ "@type": "Person", name: "Ana Ruiz" });
  });

  it("adds dateModified only from a real updatedAt, never from the publication date", () => {
    expect(buildArticleJsonLd(INPUT)).not.toHaveProperty("dateModified");
    const data = buildArticleJsonLd({
      ...INPUT,
      article: { ...INPUT.article, updatedAt: new Date("2027-01-15") },
    });
    expect(data["dateModified"]).toBe("2027-01-15T00:00:00.000Z");
  });

  it("keeps the article title as headline and never emits FAQPage", () => {
    const data = buildArticleJsonLd({ ...INPUT, article: { ...INPUT.article, seoTitle: "SEO" } });
    expect(data["headline"]).toBe("Cuánto vale mi piso en Barcelona");
    expect(JSON.stringify(data)).not.toContain("FAQPage");
  });
});
