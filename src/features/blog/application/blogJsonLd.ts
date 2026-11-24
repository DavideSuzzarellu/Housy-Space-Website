import type { Company } from "@/features/agency/domain/company";
import { getDictionary } from "@/shared/i18n";
import { LOCALE_META } from "@/shared/i18n/config";
import { compactJsonLd, type JsonLdObject } from "@/shared/lib/seo/jsonLd";
import type { BlogPost } from "./posts";

export interface BlogJsonLdInput {
  readonly post: BlogPost;
  /** Absolute canonical URL of the post page. */
  readonly url: string;
  /** Absolute site origin (`Astro.site`). */
  readonly siteUrl: string;
  readonly company: Company;
}

/**
 * schema.org `BlogPosting` (an `Article`). Publisher is the agency (confirmed data only); the
 * author is the named person or, without one, the agency. `dateModified` exists only when the
 * editors recorded a real update. No `FAQPage`: the renderer has no FAQ block and the markup must
 * mirror visible content.
 */
export function buildBlogJsonLd({ post, url, siteUrl, company }: BlogJsonLdInput): JsonLdObject {
  const { title, description, date, updatedAt, image, imageAlt, author, language } = post.data;
  const publisher: JsonLdObject = {
    "@type": "RealEstateAgent",
    name: company.legalName,
    url: siteUrl,
  };
  return compactJsonLd({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    datePublished: date.toISOString(),
    dateModified: updatedAt?.toISOString(),
    inLanguage: LOCALE_META[language].langTag,
    articleSection: getDictionary(language).blog.categories[post.data.category],
    keywords: [post.data.keyword, ...(post.data.secondaryKeywords ?? [])].join(", "),
    image: {
      "@type": "ImageObject",
      url: new URL(image.src, siteUrl).href,
      description: imageAlt,
    },
    author: author ? { "@type": "Person", name: author } : publisher,
    publisher,
  });
}
