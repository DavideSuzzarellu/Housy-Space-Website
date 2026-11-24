import deploy from "../../../../deploy.config.json";

/**
 * Canonical (production) origin, AGENTS.md §1. Single source: `deploy.config.json`, which the
 * Cloudflare `worker.js` reads too. The apex (no www) is canonical, as for the reference site Google already knows; switching to www is a one-line
 * change there (see docs/deploy-cloudflare.md). Only a build whose own `site` is this origin may be indexed.
 */
export const PRODUCTION_ORIGIN: string = deploy.productionOrigin;

/**
 * A copy of the site (GitHub Pages staging, localhost previews, any other host) must never compete
 * with the real one: it is indexable only when its origin is the production origin.
 */
export function isIndexableSite(site: URL | undefined): boolean {
  return site !== undefined && site.origin === PRODUCTION_ORIGIN;
}

/**
 * Content of the robots meta tag, or `undefined` for "no tag" (indexable page of an indexable site).
 * A non-indexable site overrides the per-page value with `noindex,nofollow`.
 */
export function robotsMetaContent(
  indexableSite: boolean,
  pageNoindex: boolean,
): string | undefined {
  if (!indexableSite) return "noindex,nofollow";
  return pageNoindex ? "noindex,follow" : undefined;
}
