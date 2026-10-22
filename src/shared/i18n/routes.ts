import { DEFAULT_LOCALE, LOCALE_META, LOCALES, type Locale } from "./config";

/**
 * Route map (AGENTS.md §4.1). Templates are the path after the locale prefix;
 * `{name}` placeholders become typed params of `getLocalizedPath`.
 * Astro i18n does not translate segments, so this map is the only place they live.
 */
export const routes = {
  home: { es: "", en: "", it: "", ca: "" },
  sale: { es: "venta", en: "sale", it: "vendita", ca: "venda" },
  rent: { es: "alquiler", en: "rent", it: "affitto", ca: "lloguer" },
  saleDetail: {
    es: "venta/{slug}-{ref}",
    en: "sale/{slug}-{ref}",
    it: "vendita/{slug}-{ref}",
    ca: "venda/{slug}-{ref}",
  },
  // One canonical URL per operation (§4.1): rent details live under the rent listing segment.
  rentDetail: {
    es: "alquiler/{slug}-{ref}",
    en: "rent/{slug}-{ref}",
    it: "affitto/{slug}-{ref}",
    ca: "lloguer/{slug}-{ref}",
  },
  services: { es: "servicios", en: "services", it: "servizi", ca: "serveis" },
  serviceDetail: {
    es: "servicios/{service}",
    en: "services/{service}",
    it: "servizi/{service}",
    ca: "serveis/{service}",
  },
  living: {
    es: "vivir-en-barcelona",
    en: "living-in-barcelona",
    it: "vivere-a-barcellona",
    ca: "viure-a-barcelona",
  },
  district: {
    es: "vivir-en-barcelona/{district}",
    en: "living-in-barcelona/{district}",
    it: "vivere-a-barcellona/{district}",
    ca: "viure-a-barcelona/{district}",
  },
  barrio: {
    es: "vivir-en-barcelona/{district}/{barrio}",
    en: "living-in-barcelona/{district}/{barrio}",
    it: "vivere-a-barcellona/{district}/{barrio}",
    ca: "viure-a-barcelona/{district}/{barrio}",
  },
  municipalities: {
    es: "provincia-de-barcelona",
    en: "barcelona-province",
    it: "provincia-di-barcellona",
    ca: "provincia-de-barcelona",
  },
  municipality: {
    es: "provincia-de-barcelona/{municipio}",
    en: "barcelona-province/{municipio}",
    it: "provincia-di-barcellona/{municipio}",
    ca: "provincia-de-barcelona/{municipio}",
  },
  about: { es: "nosotros", en: "about-us", it: "chi-siamo", ca: "qui-som" },
  contact: { es: "contacto", en: "contact", it: "contatti", ca: "contacte" },
  legalNotice: { es: "aviso-legal", en: "legal-notice", it: "note-legali", ca: "avis-legal" },
  privacy: { es: "privacidad", en: "privacy-policy", it: "privacy", ca: "privacitat" },
  cookies: { es: "cookies", en: "cookie-policy", it: "cookie", ca: "galetes" },
  sell: { es: "vender", en: "sell", it: "vendere", ca: "vendre" },
  valuation: { es: "valoracion", en: "valuation", it: "valutazione", ca: "valoracio" },
  blog: { es: "blog", en: "blog", it: "blog", ca: "blog" },
  blogPost: { es: "blog/{slug}", en: "blog/{slug}", it: "blog/{slug}", ca: "blog/{slug}" },
  customSearch: {
    es: "busqueda-a-medida",
    en: "property-search-service",
    it: "ricerca-su-misura",
    ca: "cerca-a-mida",
  },
  internationalGuide: {
    es: "guia-internacional",
    en: "international-guide",
    it: "guida-internazionale",
    ca: "guia-internacional",
  },
  dataSources: { es: "datos", en: "data", it: "dati", ca: "dades" },
} as const satisfies Record<string, Record<Locale, string>>;

export type RouteKey = keyof typeof routes;

/** Every route key, in declaration order. */
export const ROUTE_KEYS = Object.keys(routes).filter((key): key is RouteKey => key in routes);

/** Extracts `{name}` placeholders from a template literal type. */
type PlaceholderNames<T extends string> = T extends `${string}{${infer Name}}${infer Rest}`
  ? Name | PlaceholderNames<Rest>
  : never;

/** Param names of a route (taken from its `es` template; all locales share them). */
export type RouteParamName<K extends RouteKey> = PlaceholderNames<(typeof routes)[K]["es"]>;

export type RouteParams<K extends RouteKey> = Readonly<Record<RouteParamName<K>, string>>;

/** Routes without placeholders take no params; the rest require all of theirs. */
type ParamsArgs<K extends RouteKey> = [RouteParamName<K>] extends [never]
  ? []
  : [params: RouteParams<K>];

type AlternateParamsArgs<K extends RouteKey> = [RouteParamName<K>] extends [never]
  ? []
  : [params: RouteParams<K> | ((locale: Locale) => RouteParams<K>)];

const SLUG_SEGMENT = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PLACEHOLDER = /\{([a-zA-Z]+)\}/g;

function buildPath(
  routeKey: RouteKey,
  locale: Locale,
  params: Readonly<Record<string, string>>,
): string {
  const template: string = routes[routeKey][locale];
  const path = template.replace(PLACEHOLDER, (_match, name: string) => {
    const value = params[name];
    if (value === undefined || !SLUG_SEGMENT.test(value)) {
      throw new RangeError(
        `getLocalizedPath: param "${name}" must be a lowercase ASCII slug (use slugify)`,
      );
    }
    return value;
  });
  return path === "" ? `/${locale}` : `/${locale}/${path}`;
}

/**
 * Builds the localized path for a route: `/{locale}/{translated segments}`,
 * never with a trailing slash. The only allowed way to build internal URLs.
 */
export function getLocalizedPath<K extends RouteKey>(
  routeKey: K,
  locale: Locale,
  ...args: ParamsArgs<K>
): string {
  const [params] = args;
  return buildPath(routeKey, locale, params ?? {});
}

export interface Alternate {
  /** BCP 47 tag for `hreflang`, or `x-default`. */
  readonly hreflang: string;
  readonly locale: Locale;
  /** Root-relative path; make it absolute with the site URL when rendering. */
  readonly path: string;
}

/**
 * `hreflang` alternates for every locale plus `x-default` → the default-locale URL.
 * Params can be shared or computed per locale (localized slugs).
 */
export function getAlternates<K extends RouteKey>(
  routeKey: K,
  ...args: AlternateParamsArgs<K>
): Alternate[] {
  const [params] = args;
  const pathFor = (locale: Locale): string =>
    buildPath(routeKey, locale, typeof params === "function" ? params(locale) : (params ?? {}));

  const alternates = LOCALES.map((locale): Alternate => ({
    hreflang: LOCALE_META[locale].langTag,
    locale,
    path: pathFor(locale),
  }));
  return [
    ...alternates,
    { hreflang: "x-default", locale: DEFAULT_LOCALE, path: pathFor(DEFAULT_LOCALE) },
  ];
}

export interface UrlExtras {
  /** Query parameters (filters such as `?vista=mapa`). Encoded with `URLSearchParams`. */
  readonly query?: Readonly<Record<string, string>>;
  /** In-page anchor, without `#`. */
  readonly hash?: string;
}

/**
 * Appends query params and/or a hash to a path from `getLocalizedPath`.
 * Keeps URL building in one place (no string concatenation in components).
 */
export function withUrlExtras(path: string, extras: UrlExtras): string {
  const search = new URLSearchParams(extras.query).toString();
  const hash =
    extras.hash === undefined || extras.hash === "" ? "" : `#${encodeURIComponent(extras.hash)}`;
  return `${path}${search === "" ? "" : `?${search}`}${hash}`;
}
