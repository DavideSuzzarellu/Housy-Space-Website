import { unknownFigures, type AllowedFigures } from "@/features/districts/domain/marketFigures";
import { SEO_TITLE_MAX, isDescriptionLengthOk } from "../domain/articleModel";
import { findBannedClaims } from "../domain/bannedClaims";
import { countWords, extractHeadings, extractLinks, firstWords } from "../domain/markdown";
import { DUPLICATE_THRESHOLD, jaccard, shingles } from "../domain/similarity";
import { containsPhrase, normalizeText } from "../domain/text";
import type { ArticleData } from "../infrastructure/articleFiles";
import { classifyHref, type LinkAllowList, type LinkTarget } from "./linkAllowList";

export type Severity = "error" | "warning";

export interface Finding {
  readonly rule: string;
  readonly severity: Severity;
  readonly slug: string;
  readonly articleId: string;
  /** Spanish, for the editors: what is wrong and how to fix it. */
  readonly message: string;
}

export interface CheckableArticle {
  readonly slug: string;
  readonly data: ArticleData;
  readonly body: string;
}

export interface CheckContext {
  /** Every article of the collection, the subject included. */
  readonly articles: readonly CheckableArticle[];
  readonly links: LinkAllowList;
  readonly figures: AllowedFigures;
  /** Whether the main image file exists (path as written in the frontmatter). */
  readonly imageExists: (image: string) => boolean;
}

export const MIN_INTERNAL_LINKS = 2;
export const INTRO_WORDS = 100;
/** A published article shorter than this gets a warning; the topic decides the length, no fixed count. */
export const SHORT_ARTICLE_WORDS = 400;

const sameText = (a: string, b: string): boolean => normalizeText(a) === normalizeText(b);

/**
 * Editorial and SEO checks of one article against the rest of the collection. Pure: the caller
 * supplies the context (other articles, real routes, market figures, image lookup).
 */
export function checkArticle(article: CheckableArticle, context: CheckContext): Finding[] {
  const { slug, data, body } = article;
  const findings: Finding[] = [];
  const add = (rule: string, severity: Severity, message: string): void => {
    findings.push({ rule, severity, slug, articleId: data.articleId, message });
  };
  const others = context.articles.filter((other) => other.slug !== slug);

  // Identity and cannibalization.
  for (const other of others) {
    if (other.data.articleId === data.articleId) {
      add(
        "duplicate-article-id",
        "error",
        `El identificador ${data.articleId} ya lo usa «${other.slug}».`,
      );
    }
    if (sameText(other.data.keyword, data.keyword)) {
      add(
        "duplicate-keyword",
        "error",
        `La palabra clave «${data.keyword}» ya es la de «${other.slug}» (canibalización).`,
      );
    }
    if (sameText(other.data.title, data.title)) {
      add("duplicate-title", "error", `El título es idéntico al de «${other.slug}».`);
    }
  }

  // Keyword and titles.
  const seoTitle = data.seoTitle ?? data.title;
  if (!containsPhrase(data.title, data.keyword) && !containsPhrase(seoTitle, data.keyword)) {
    add(
      "keyword-missing-in-title",
      "error",
      `La palabra clave «${data.keyword}» no aparece en el título ni en el título SEO.`,
    );
  }
  if (!containsPhrase(firstWords(body, INTRO_WORDS), data.keyword)) {
    add(
      "keyword-missing-in-intro",
      "error",
      `La palabra clave «${data.keyword}» no aparece en las primeras ${INTRO_WORDS} palabras.`,
    );
  }
  if (seoTitle.length > SEO_TITLE_MAX) {
    add(
      "title-too-long",
      "error",
      `El título que verá Google tiene ${seoTitle.length} caracteres (máximo ${SEO_TITLE_MAX}); acórtalo o añade seoTitle.`,
    );
  }
  if (!isDescriptionLengthOk(data.description)) {
    add(
      "description-length",
      data.status === "borrador" ? "warning" : "error",
      `La descripción tiene ${data.description.length} caracteres (debe tener entre 140 y 155).`,
    );
  }

  // Links.
  const internal: LinkTarget[] = [];
  for (const link of extractLinks(body)) {
    const href = classifyHref(link.href);
    if (href.kind === "relative") {
      add(
        "link-relative",
        "error",
        `El enlace «${link.href}» es relativo: usa la ruta completa (/es/...).`,
      );
    }
    if (href.kind !== "internal") continue;
    const target = context.links.resolve(href.path);
    if (target === undefined) {
      add("link-not-found", "error", `El enlace interno ${href.path} no es una página de la web.`);
      continue;
    }
    internal.push(target);
    if (target.locale !== data.language) {
      add(
        "link-other-language",
        "warning",
        `El enlace ${href.path} lleva a la versión «${target.locale}» y el artículo está en «${data.language}».`,
      );
    }
    const linked =
      target.kind === "article" ? others.find((other) => other.slug === target.slug) : undefined;
    if (linked !== undefined && linked.data.status !== "publicado" && data.status === "publicado") {
      add(
        "link-unpublished-article",
        "warning",
        `Enlaza a «${linked.slug}», que aún no está publicado.`,
      );
    }
  }
  if (internal.length < MIN_INTERNAL_LINKS) {
    add(
      "internal-links-min",
      "error",
      `Tiene ${internal.length} enlaces internos válidos; hacen falta al menos ${MIN_INTERNAL_LINKS}.`,
    );
  }
  if (!internal.some((target) => target.kind === "service")) {
    add(
      "service-link-missing",
      "error",
      "Falta al menos un enlace a una página de servicio (/es/servicios/...).",
    );
  }

  // Structure and media.
  const headings = extractHeadings(body);
  if (headings.some((heading) => heading.depth === 1)) {
    add("body-h1", "error", "El texto no puede llevar un H1: el titular ya es el H1 de la página.");
  }
  let previous = 1;
  for (const heading of headings.filter((h) => h.depth > 1)) {
    if (heading.depth > previous + 1) {
      add(
        "heading-order",
        "error",
        `El encabezado «${heading.text}» (H${heading.depth}) salta niveles; viene tras un H${previous}.`,
      );
    }
    previous = heading.depth;
  }
  if (!context.imageExists(data.image)) {
    add("image-missing", "error", `No existe la imagen principal ${data.image}.`);
  }
  if (/!\[\s*\]\(/.test(body)) {
    add("body-image-alt", "error", "Hay una imagen en el texto sin descripción (alt).");
  }

  // Legal, tax and market claims.
  if (data.legalFiscal && data.sources.length === 0) {
    add(
      "sources-required",
      "error",
      "Un artículo legal, fiscal o económico necesita fuentes oficiales (sources).",
    );
  }
  for (const figure of unknownFigures(body, context.figures)) {
    add(
      "market-figure-unknown",
      "error",
      `La cifra «${figure.raw}» no es un dato de la colección de mercado.`,
    );
  }
  for (const phrase of findBannedClaims(body, data.language)) {
    add("banned-claim", "error", `Promesa prohibida: «${phrase}».`);
  }

  // Quality warnings.
  const words = countWords(body);
  if (data.status === "publicado" && words < SHORT_ARTICLE_WORDS) {
    add(
      "short-article",
      "warning",
      `Tiene ${words} palabras; menos de ${SHORT_ARTICLE_WORDS} suele ser poco para posicionar.`,
    );
  }
  const mine = shingles(body);
  if (words >= 50) {
    for (const other of others) {
      const similarity = jaccard(mine, shingles(other.body));
      if (similarity >= DUPLICATE_THRESHOLD) {
        add(
          "duplicate-content",
          "warning",
          `El texto se parece un ${Math.round(similarity * 100)} % al de «${other.slug}».`,
        );
      }
    }
  }
  return findings;
}

/** Every article of the collection checked against the others, errors first. */
export function checkAll(
  articles: readonly CheckableArticle[],
  context: Omit<CheckContext, "articles">,
): Finding[] {
  return articles
    .flatMap((article) => checkArticle(article, { ...context, articles }))
    .sort((a, b) => Number(b.severity === "error") - Number(a.severity === "error"));
}
