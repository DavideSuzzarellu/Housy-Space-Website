import { z } from "astro/zod";
import { LOCALES } from "@/shared/i18n/config";
import {
  ARTICLE_ID_PATTERN,
  ARTICLE_STATUSES,
  BLOG_CATEGORIES,
  CLUSTERS,
  CTA_OBJECTIVES,
  DESCRIPTION_MAX,
  DESCRIPTION_MIN,
  isDescriptionLengthOk,
  LEGAL_REVIEWS,
  SEARCH_INTENTS,
  SEO_TITLE_MAX,
} from "../domain/articleModel";

const text = z.string().trim().min(1);

/** An official source the article relies on; the date is when a human last checked it. */
const sourceSchema = z
  .object({
    label: text,
    url: z.url({ protocol: /^https$/ }),
    checkedAt: z.coerce.date(),
  })
  .strict();

/**
 * Frontmatter of a blog article (`src/content/blog/{slug}.md`), written by Pages CMS or by the
 * editorial assistant in a pull request. Strict, so a field the form adds without the site
 * knowing it fails the build. Tests pass a stand-in `image`.
 *
 * Gates in `superRefine` carry a stable `params.key` next to the Spanish message, so tools can
 * react to them without parsing text.
 */
export function blogSchema<I extends z.ZodType>(image: () => I) {
  return z
    .object({
      title: text,
      description: text,
      /** Publication date; a future date schedules the article for the next daily rebuild. */
      date: z.coerce.date(),
      category: z.enum(BLOG_CATEGORIES),
      /** Language the article is written in; it is indexed only under that locale. */
      language: z.enum(LOCALES),
      image: image(),
      imageAlt: text,
      author: text.optional(),
      articleId: z.string().regex(ARTICLE_ID_PATTERN),
      status: z.enum(ARTICLE_STATUSES).default("borrador"),
      keyword: text,
      intent: z.enum(SEARCH_INTENTS),
      secondaryKeywords: z.array(text).optional(),
      cluster: z.enum(CLUSTERS),
      pillar: z.boolean().optional(),
      cta: z.enum(CTA_OBJECTIVES),
      legalFiscal: z.boolean(),
      legalReview: z.enum(LEGAL_REVIEWS).default("no_aplica"),
      sources: z.array(sourceSchema).default([]),
      reviewedAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
      seoTitle: text.max(SEO_TITLE_MAX).optional(),
    })
    .strict()
    .superRefine((article, ctx) => {
      const fail = (key: string, path: string, message: string): void => {
        ctx.addIssue({ code: "custom", path: [path], message, params: { key } });
      };
      const live = article.status !== "borrador";

      if (live && !isDescriptionLengthOk(article.description)) {
        fail(
          "description_length",
          "description",
          `La descripción debe tener entre ${DESCRIPTION_MIN} y ${DESCRIPTION_MAX} caracteres (tiene ${article.description.length}).`,
        );
      }
      if (
        (article.status === "aprobado" || article.status === "publicado") &&
        !article.reviewedAt
      ) {
        fail(
          "reviewed_at_required",
          "reviewedAt",
          "Un artículo aprobado o publicado necesita la fecha de revisión (reviewedAt).",
        );
      }
      if (article.legalFiscal && article.legalReview === "no_aplica") {
        fail(
          "legal_review_required",
          "legalReview",
          "Un artículo legal, fiscal o económico no puede marcar la revisión como «no_aplica».",
        );
      }
      if (article.legalFiscal && live && article.sources.length === 0) {
        fail(
          "sources_required",
          "sources",
          "Un artículo legal, fiscal o económico necesita al menos una fuente oficial.",
        );
      }
      if (
        article.status === "publicado" &&
        article.legalFiscal &&
        article.legalReview !== "aprobada"
      ) {
        fail(
          "legal_review_not_approved",
          "legalReview",
          "No se puede publicar un artículo legal o fiscal sin revisión legal aprobada.",
        );
      }
    });
}

export type BlogArticleData = z.infer<ReturnType<typeof blogSchema<z.ZodString>>>;
