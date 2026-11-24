import market from "../../content/market/barcelona.json";
import { routes } from "./routes";
import type { RedirectRule } from "./retiredRoutes";
import { getServiceSlug, SERVICE_KEYS } from "./services";

/**
 * Migration redirects: every URL of the reference site (housyspace-web-ref, Cloudflare, 2026-11)
 * and of the WordPress site before it, which the new site replaces at the same domain, so the
 * URLs Google already knows answer 301 to their new page. All of them are Spanish, at the domain
 * root (no locale prefix); destinations are the Spanish routes, without the site base.
 *
 * The reference used the same zone and service slugs, so those pages keep their path under `/es`.
 * Not covered on purpose: `/blog/es-fiable-valoracion-online` (the new blog has no such article
 * yet) goes to the blog index; the six demo listings under `/propiedades/` are not real listings.
 */

const ES = "es";
const toEs = (template: string): string => `/${ES}/${template}`;
/** Where a reference URL sits: the Spanish route template at the domain root. */
const atRoot = (template: string): string => `/${template}`;

const LEGACY_LISTING = "propiedades";

type LegacyPair = readonly [from: string, to: string];

/** Paths that exist in the new site with the same Spanish template, now under `/es`. */
const SAME_PATH_TEMPLATES: readonly string[] = [
  routes.services.es,
  routes.about.es,
  routes.contact.es,
  routes.mySearch.es,
  routes.blog.es,
  routes.legalNotice.es,
  routes.privacy.es,
  routes.cookies.es,
  routes.dataSources.es,
  routes.living.es,
  ...SERVICE_KEYS.map((service) =>
    routes.serviceDetail.es.replace("{service}", getServiceSlug(service, ES)),
  ),
  ...market.districts.map(({ slug }) => routes.district.es.replace("{district}", slug)),
  ...market.barrios.map(({ slug }) => routes.barrio.es.replace("{barrio}", slug)),
];

/**
 * Reference blog posts and its own `_redirects` (WordPress URLs, retargeted to the new site):
 * the reference sent these to its own pages; here they go to the page that replaced them.
 */
const OTHER_PAIRS: readonly LegacyPair[] = [
  // The reference called the property listing "propiedades".
  [atRoot(LEGACY_LISTING), toEs(routes.sale.es)],
  [atRoot("blog/es-fiable-valoracion-online"), toEs(routes.blog.es)],
  [atRoot("servicios/asesoramiento"), toEs(routes.services.es)],
  [
    atRoot("vende"),
    toEs(routes.serviceDetail.es.replace("{service}", getServiceSlug("saleBrokerage", ES))),
  ],
  [atRoot("busco-vivienda"), toEs(routes.mySearch.es)],
  [atRoot("busqueda-a-medida"), toEs(routes.mySearch.es)],
  [atRoot("politica-cookies"), toEs(routes.cookies.es)],
  [atRoot("politica-de-privacidad"), toEs(routes.privacy.es)],
  [atRoot("housyspace"), toEs(routes.about.es)],
  [atRoot("atico-en-ensanche-derecho"), toEs(routes.sale.es)],
  [atRoot("housyspace-venta-compra-y-alquiler-de-inmuebles"), `/${ES}`],
];

/** A page URL answers with and without the trailing slash, and as its `index.html` (as the reference's `_redirects`). */
const withForms = ([from, to]: LegacyPair): RedirectRule[] =>
  [from, `${from}/`, `${from}/index.html`].map((source) => ({ from: source, to, status: 301 }));

/** Every reference-site URL as a 301 rule (host `_redirects`), `/` and the demo listings included. */
export function getLegacyRedirectRules(): RedirectRule[] {
  return [
    { from: "/index.html", to: `/${ES}`, status: 301 },
    ...SAME_PATH_TEMPLATES.flatMap((template) => withForms([atRoot(template), toEs(template)])),
    ...OTHER_PAIRS.flatMap(withForms),
    // The reference's demo listings (`/propiedades/<slug>/`) were not real properties.
    { from: `${atRoot(LEGACY_LISTING)}/*`, to: toEs(routes.sale.es), status: 301 },
  ];
}
