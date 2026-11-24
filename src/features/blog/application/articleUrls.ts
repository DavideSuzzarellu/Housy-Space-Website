import { LOCALES } from "@/shared/i18n/config";
import { routes } from "@/shared/i18n/routes";

/** `blogPost` is `blog/{slug}` in every locale; the pattern is derived from the route map. */
const POST_URL = new RegExp(
  `/(${LOCALES.join("|")})/${routes.blogPost.es.replace("{slug}", "([a-z0-9-]+)")}$`,
);

/**
 * An article page is indexed only under the locale of its own language (AGENTS.md §4): every
 * other locale serves it with `noindex`, so those URLs stay out of the sitemap. Any URL that is
 * not an article page is kept. `languages` maps an article slug to its language.
 */
export function isIndexableArticleUrl(
  pathname: string,
  languages: ReadonlyMap<string, string>,
): boolean {
  const match = POST_URL.exec(pathname);
  const locale = match?.[1];
  const slug = match?.[2];
  if (locale === undefined || slug === undefined) return true;
  return languages.get(slug) === locale;
}
