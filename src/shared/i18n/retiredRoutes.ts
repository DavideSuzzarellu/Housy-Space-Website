import { LOCALES, type Locale } from "./config";
import { routes } from "./routes";
import { getServiceSlug } from "./services";

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
 * The sell page is now the sale brokerage service; the advisory service folds into the services index.
 */
export function getRetiredRedirects(): Record<string, string> {
  const entries = LOCALES.flatMap((locale) => {
    const services = `/${locale}/${routes.services[locale]}`;
    const detail = (slug: string) =>
      `/${locale}/${routes.serviceDetail[locale].replace("{service}", slug)}`;
    return [
      [`/${locale}/${RETIRED.sell[locale]}`, detail(getServiceSlug("saleBrokerage", locale))],
      [detail(RETIRED.advisory[locale]), services],
    ] as const;
  });
  return Object.fromEntries(entries);
}
