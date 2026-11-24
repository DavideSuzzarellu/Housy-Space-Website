import type { Locale } from "./config";

/** Services offered (AGENTS.md §6 item 17). Labels live in the dictionaries (`serviceNames`). */
export const SERVICE_KEYS = [
  "saleBrokerage",
  "valuation",
  "legalTax",
  "renovations",
  "financial",
  "personalShopper",
  "investment",
  "rentalManagement",
] as const;

export type ServiceKey = (typeof SERVICE_KEYS)[number];

/** `{service}` param of the `serviceDetail` route: keyword slugs per locale (SEO, AGENTS.md section 4.1). */
const SERVICE_SLUGS_ES = {
  saleBrokerage: "venta-estrategica",
  rentalManagement: "alquiler-gestion",
  personalShopper: "personal-shopper",
  renovations: "reformas-obras",
  legalTax: "asesoramiento-juridico-fiscal",
  financial: "asesoramiento-financiero",
  investment: "inversion-inmobiliaria",
  valuation: "valoracion",
} as const satisfies Record<ServiceKey, string>;

const SERVICE_SLUGS = {
  es: SERVICE_SLUGS_ES,
  en: {
    saleBrokerage: "property-sales-brokerage",
    rentalManagement: "rentals-property-management",
    personalShopper: "real-estate-personal-shopper",
    renovations: "renovations-interior-design",
    legalTax: "legal-tax-advice",
    financial: "financial-advice",
    investment: "real-estate-investment",
    valuation: "property-valuation",
  },
  it: {
    saleBrokerage: "compravendita-intermediazione",
    rentalManagement: "affitto-gestione-immobili",
    personalShopper: "personal-shopper-immobiliare",
    renovations: "ristrutturazioni-interior-design",
    legalTax: "consulenza-legale-fiscale",
    financial: "consulenza-finanziaria",
    investment: "investimento-immobiliare",
    valuation: "valutazione-immobiliare",
  },
  ca: {
    saleBrokerage: "compravenda-intermediacio",
    rentalManagement: "lloguer-gestio-immobles",
    personalShopper: "personal-shopper-immobiliari",
    renovations: "reformes-interiorisme",
    legalTax: "assessorament-juridic-fiscal",
    financial: "assessorament-financer",
    investment: "inversio-immobiliaria",
    valuation: "valoracio-immobiliaria",
  },
} as const satisfies Record<Locale, Record<ServiceKey, string>>;

export function getServiceSlug(service: ServiceKey, locale: Locale): string {
  return SERVICE_SLUGS[locale][service];
}

/** Service of a content link target (`service:{es slug}`). */
export function getServiceKeyBySlug(slug: string): ServiceKey | undefined {
  return SERVICE_KEYS.find((service) => SERVICE_SLUGS_ES[service] === slug);
}
