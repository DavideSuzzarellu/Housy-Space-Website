/** Vocabulary of the blog content model (docs/blog/flujo-editorial.md). Pure: no Zod, no Astro. */

/** Editorial states, mirroring the client's reference generator. Only `publicado` goes live. */
export const ARTICLE_STATUSES = ["borrador", "revisado", "aprobado", "publicado"] as const;
export type ArticleStatus = (typeof ARTICLE_STATUSES)[number];

export const SEARCH_INTENTS = ["informacional", "comercial", "transaccional"] as const;
export type SearchIntent = (typeof SEARCH_INTENTS)[number];

/** A valoración y precio · B gastos e impuestos · C proceso de venta · D situaciones especiales. */
export const CLUSTERS = ["A", "B", "C", "D"] as const;
export type Cluster = (typeof CLUSTERS)[number];

/** Closing call to action of the article: where the reader is sent. */
export const CTA_OBJECTIVES = ["valoracion", "venta", "consulta"] as const;
export type CtaObjective = (typeof CTA_OBJECTIVES)[number];

export const LEGAL_REVIEWS = ["no_aplica", "pendiente", "aprobada"] as const;
export type LegalReview = (typeof LEGAL_REVIEWS)[number];

/** Category slugs (the client's set); display names live in the dictionaries (`blog.categories`). */
export const BLOG_CATEGORIES = [
  "valoracion",
  "venta",
  "gastos-impuestos",
  "herencias",
  "contratos-documentacion",
  "mercado-barcelona",
] as const;
export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

/** `HS-YYYY-MM-NN`: the article's permanent identity (approvals are bound to it). */
export const ARTICLE_ID_PATTERN = /^HS-\d{4}-(?:0[1-9]|1[0-2])-\d{2}$/;

export const SEO_TITLE_MAX = 60;
export const DESCRIPTION_MIN = 140;
export const DESCRIPTION_MAX = 155;

/** Meta description length rule; drafts are only warned about (see `checkArticle`). */
export function isDescriptionLengthOk(description: string): boolean {
  return description.length >= DESCRIPTION_MIN && description.length <= DESCRIPTION_MAX;
}
