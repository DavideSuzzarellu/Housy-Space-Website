import { organizationJsonLd } from "@/features/agency/application/organizationJsonLd";
import type { Company } from "@/features/agency/domain/company";
import { LOCALE_META, type Locale } from "@/shared/i18n/config";
import { compactJsonLd, type JsonLdObject } from "@/shared/lib/seo/jsonLd";

/** The article fields structured data needs (a subset of the frontmatter). */
export interface ArticleJsonLdFields {
  readonly title: string;
  readonly description: string;
  readonly date: Date;
  readonly updatedAt?: Date | undefined;
  readonly language: Locale;
  readonly author?: string | undefined;
  readonly keyword: string;
  readonly secondaryKeywords?: readonly string[] | undefined;
}

export interface ArticleJsonLdInput {
  readonly article: ArticleJsonLdFields & { readonly seoTitle?: string | undefined };
  /** Display name of the category in the article's own language. */
  readonly categoryName: string;
  /** Absolute canonical URL of the article page. */
  readonly url: string;
  /** Absolute URL of the optimized main image. */
  readonly imageUrl: string;
  /** Absolute site origin (`Astro.site`). */
  readonly siteUrl: string;
  readonly company: Company;
}

/**
 * schema.org `Article` of a blog post. Publisher is the agency (confirmed data only); the author
 * is the named person or, without one, the agency. `dateModified` exists only when the editors
 * recorded a real update. No `FAQPage`: the renderer has no FAQ block, and the markup must
 * mirror visible content.
 */
export function buildArticleJsonLd(input: ArticleJsonLdInput): JsonLdObject {
  const { article, categoryName, url, imageUrl, siteUrl, company } = input;
  const publisher = organizationJsonLd(company, siteUrl);
  return compactJsonLd({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: article.date.toISOString(),
    dateModified: article.updatedAt?.toISOString(),
    inLanguage: LOCALE_META[article.language].langTag,
    articleSection: categoryName,
    keywords: [article.keyword, ...(article.secondaryKeywords ?? [])].join(", "),
    image: [imageUrl],
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    author: article.author === undefined ? publisher : { "@type": "Person", name: article.author },
    publisher,
  });
}
