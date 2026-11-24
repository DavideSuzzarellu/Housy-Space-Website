import market from "../../content/market/barcelona.json";
import { LOCALES, type Locale } from "./config";
import { RETIRED_MUNICIPALITIES } from "./retiredMunicipalities";
import { routes } from "./routes";
import { getServiceSlug } from "./services";

/** Old "living in Barcelona" and province segments (retired 2026-11-24: zones follow the reference). */
const OLD_LIVING = {
  es: "vivir-en-barcelona",
  en: "living-in-barcelona",
  it: "vivere-a-barcellona",
  ca: "viure-a-barcelona",
} as const satisfies Record<Locale, string>;
const OLD_PROVINCE = {
  es: "provincia-de-barcelona",
  en: "barcelona-province",
  it: "provincia-di-barcellona",
  ca: "provincia-de-barcelona",
} as const satisfies Record<Locale, string>;

/** Segments of pages that no longer exist (reference `_redirects`, 2026-11): sell page and advisory service. */
const RETIRED = {
  sell: { es: "vender", en: "sell", it: "vendere", ca: "vendre" },
  advisory: {
    es: "asesoramiento",
    en: "personalised-advice",
    it: "consulenza-personalizzata",
    ca: "assessorament-personalitzat",
  },
} as const satisfies Record<string, Record<Locale, string>>;

/**
 * Old URL → new URL (both without the site base), for the `redirects` of `astro.config.ts`.
 * Living-in-Barcelona URLs map to the zones routes (dynamic segments are kept); the removed province pages go to the zones index.
 * The sell page is now the sale brokerage service; the advisory service folds into the services index.
 */
export function getRetiredRedirects(): Record<string, string> {
  const entries = LOCALES.flatMap((locale) => {
    const services = `/${locale}/${routes.services[locale]}`;
    const detail = (slug: string) =>
      `/${locale}/${routes.serviceDetail[locale].replace("{service}", slug)}`;
    const zones = `/${locale}/${routes.living[locale]}`;
    const living = `/${locale}/${OLD_LIVING[locale]}`;
    const province = `/${locale}/${OLD_PROVINCE[locale]}`;
    return [
      [`/${locale}/${RETIRED.sell[locale]}`, detail(getServiceSlug("saleBrokerage", locale))],
      [detail(RETIRED.advisory[locale]), services],
      [living, zones],
      // Astro needs a destination route with the same params, so each old district and barrio URL is listed.
      ...market.districts.map(
        ({ slug }) =>
          [
            `${living}/${slug}`,
            `/${locale}/${routes.district[locale].replace("{district}", slug)}`,
          ] as const,
      ),
      ...market.barrios.map(
        ({ slug, district }) =>
          [
            `${living}/${district}/${slug}`,
            `/${locale}/${routes.barrio[locale].replace("{barrio}", slug)}`,
          ] as const,
      ),
      [province, zones],
      ...RETIRED_MUNICIPALITIES.map((slug) => [`${province}/${slug}`, zones] as const),
    ] as const;
  });
  return Object.fromEntries(entries);
}
