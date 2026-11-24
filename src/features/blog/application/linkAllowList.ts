import type { MarketNumbers } from "@/features/districts/infrastructure/marketSchema";
import { LOCALES, type Locale } from "@/shared/i18n/config";
import { buildPath, routes, type RouteKey } from "@/shared/i18n/routes";
import { getServiceSlug, SERVICE_KEYS } from "@/shared/i18n/services";

/** What an internal link points to; services and zones matter for the SEO rules. */
export interface LinkTarget {
  readonly kind: "page" | "service" | "zone" | "article";
  readonly locale: Locale;
  /** Article slug, for `kind: "article"`. */
  readonly slug?: string;
}

export interface LinkAllowList {
  /** The target of a root-relative path without hosting base, or `undefined` if it is not a page. */
  resolve(path: string): LinkTarget | undefined;
}

export type HrefKind =
  | { readonly kind: "internal"; readonly path: string }
  | { readonly kind: "external" }
  | { readonly kind: "ignored" }
  | { readonly kind: "relative" };

const OWN_HOSTS = new Set(["housyspace.com", "www.housyspace.com"]);

/**
 * Splits a link into what the checks need. Authors write root-relative paths without the hosting
 * base (`/es/vender`); absolute links to the own domain are accepted and reduced to their path.
 */
export function classifyHref(href: string): HrefKind {
  if (href.startsWith("#") || /^(mailto|tel):/i.test(href)) return { kind: "ignored" };
  let path = href;
  if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith("//")) {
    const url = new URL(href.startsWith("//") ? `https:${href}` : href);
    if (!OWN_HOSTS.has(url.hostname)) return { kind: "external" };
    path = url.pathname;
  } else if (!href.startsWith("/")) {
    return { kind: "relative" };
  }
  const clean = path.split(/[?#]/)[0] ?? "";
  return { kind: "internal", path: clean.length > 1 ? clean.replace(/\/+$/, "") : clean };
}

const FIXED_ROUTES = (Object.keys(routes) as RouteKey[]).filter(
  (key) => !routes[key].es.includes("{"),
);

/**
 * Every real page an article may link to, built from the same route map the site uses
 * (`buildPath`, so no hosting base), the services, the market collection (districts, barrios) and
 * the slugs of the articles themselves.
 */
export function buildLinkAllowList(input: {
  readonly market: MarketNumbers;
  readonly articleSlugs: readonly string[];
}): LinkAllowList {
  const targets = new Map<string, LinkTarget>();
  const add = (path: string, target: LinkTarget): void => {
    targets.set(path, target);
  };

  for (const locale of LOCALES) {
    for (const key of FIXED_ROUTES) {
      if (key === "home") continue;
      const kind = key === "services" ? "service" : key === "living" ? "zone" : "page";
      add(buildPath(key, locale, {}), { kind, locale });
    }
    add(buildPath("home", locale, {}), { kind: "page", locale });
    for (const service of SERVICE_KEYS) {
      const path = buildPath("serviceDetail", locale, { service: getServiceSlug(service, locale) });
      add(path, { kind: "service", locale });
    }
    for (const district of input.market.districts) {
      add(buildPath("district", locale, { district: district.slug }), { kind: "zone", locale });
    }
    for (const barrio of input.market.barrios) {
      const path = buildPath("barrio", locale, { barrio: barrio.slug });
      add(path, { kind: "zone", locale });
    }
    for (const slug of input.articleSlugs) {
      add(buildPath("blogPost", locale, { slug }), { kind: "article", locale, slug });
    }
  }
  return { resolve: (path) => targets.get(path) };
}
