import type { Company } from "@/features/agency/domain/company";
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

export function buildBlogJsonLd({ post, url, siteUrl, company }: BlogJsonLdInput): JsonLdObject {
  const { title, description, date, image, imageAlt, author } = post.data;
  return compactJsonLd({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description,
    url,
    datePublished: date.toISOString(),
    image: {
      "@type": "ImageObject",
      url: new URL(image.src, siteUrl).href,
      description: imageAlt,
    },
    author: author ? { "@type": "Person", name: author } : undefined,
    publisher: {
      "@type": "RealEstateAgent",
      name: company.legalName,
      url: siteUrl,
    },
  });
}
