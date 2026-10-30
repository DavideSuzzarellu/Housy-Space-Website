import type { Locale } from "./config";
import { getLocalizedPath, withUrlExtras } from "./routes";
import { getServiceKeyBySlug, getServiceSlug } from "./services";

/** Routes that content files may link to as `route:{name}`. */
const CONTENT_ROUTES = {
  home: "home",
  contact: "contact",
  valuation: "valuation",
  about: "about",
  privacy: "privacy",
  legal: "legalNotice",
  cookies: "cookies",
  customSearch: "customSearch",
  homeSearch: "homeSearch",
  blog: "blog",
  internationalGuide: "internationalGuide",
  dataSources: "dataSources",
  living: "living",
  sale: "sale",
} as const;

function isContentRoute(name: string): name is keyof typeof CONTENT_ROUTES {
  return name in CONTENT_ROUTES;
}

function withHash(path: string, hash: string | undefined): string {
  return hash === undefined ? path : withUrlExtras(path, { hash });
}

/**
 * Turns a symbolic content target into a URL for `locale`. External URLs, `tel:`, `mailto:` and
 * same-page `#fragments` pass through. An unknown internal target fails the build, never a 404.
 */
export function resolveContentHref(target: string, locale: Locale): string {
  const match = /^(route|service|district):([^#]+)(?:#(.+))?$/.exec(target);
  if (match === null) return target;
  const [, scheme, name = "", hash] = match;
  if (scheme === "route" && isContentRoute(name)) {
    return withHash(getLocalizedPath(CONTENT_ROUTES[name], locale), hash);
  }
  if (scheme === "district") {
    return withHash(getLocalizedPath("district", locale, { district: name }), hash);
  }
  const service = scheme === "service" ? getServiceKeyBySlug(name) : undefined;
  if (service !== undefined) {
    return withHash(
      getLocalizedPath("serviceDetail", locale, { service: getServiceSlug(service, locale) }),
      hash,
    );
  }
  throw new Error(`Unknown content link target "${target}"`);
}
