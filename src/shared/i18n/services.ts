import type { Locale } from "./config";

/** Services offered (AGENTS.md §6 item 17). Labels live in the dictionaries (`serviceNames`). */
export const SERVICE_KEYS = [
  "saleBrokerage",
  "valuation",
  "legalTax",
  "renovations",
  "advisory",
  "financial",
  "personalShopper",
  "investment",
  "rentalManagement",
] as const;

export type ServiceKey = (typeof SERVICE_KEYS)[number];

/**
 * `{service}` param of the `serviceDetail` route.
 * TODO: AGENTS.md §4.1 has no localized service slugs yet. The UI proposal's Spanish slugs are
 * used for every locale until the client confirms translations (never invent them).
 */
const SERVICE_SLUGS_ES = {
  saleBrokerage: "venta-estrategica",
  rentalManagement: "alquiler-gestion",
  personalShopper: "personal-shopper",
  renovations: "reformas-obras",
  legalTax: "asesoramiento-juridico-fiscal",
  financial: "asesoramiento-financiero",
  advisory: "asesoramiento",
  investment: "inversion-inmobiliaria",
  valuation: "valoracion",
} as const satisfies Record<ServiceKey, string>;

const SERVICE_SLUGS = {
  es: SERVICE_SLUGS_ES,
  en: SERVICE_SLUGS_ES,
  it: SERVICE_SLUGS_ES,
  ca: SERVICE_SLUGS_ES,
} as const satisfies Record<Locale, Record<ServiceKey, string>>;

export function getServiceSlug(service: ServiceKey, locale: Locale): string {
  return SERVICE_SLUGS[locale][service];
}

/** Service of a content link target (`service:{es slug}`). */
export function getServiceKeyBySlug(slug: string): ServiceKey | undefined {
  return SERVICE_KEYS.find((service) => SERVICE_SLUGS_ES[service] === slug);
}
