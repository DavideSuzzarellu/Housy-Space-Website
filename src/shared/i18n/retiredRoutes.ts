import market from "../../content/market/barcelona.json";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "./config";
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
      // "Custom search" merged into "My search" (reference `_redirects`).
      [`/${locale}/${routes.customSearch[locale]}`, `/${locale}/${routes.mySearch[locale]}`],
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

export interface RedirectRule {
  /** Source path, without the site base. A trailing `/*` is a splat (everything below). */
  readonly from: string;
  /** Destination path, without the site base. */
  readonly to: string;
  readonly status: 301;
}

/**
 * Every permanent (301) redirect the site needs, for the host (Cloudflare/Netlify `_redirects`).
 * Same source as `getRetiredRedirects()`, with the 311 retired municipality pages of each locale
 * collapsed into one splat rule.
 */
export function getRetiredRedirectRules(): RedirectRule[] {
  const provinceRoots = LOCALES.map((locale) => `/${locale}/${OLD_PROVINCE[locale]}`);
  const explicit = Object.entries(getRetiredRedirects())
    .filter(([from]) => !provinceRoots.some((root) => from.startsWith(`${root}/`)))
    .map(([from, to]): RedirectRule => ({ from, to, status: 301 }));
  const provinceSplats = LOCALES.map((locale): RedirectRule => ({
    from: `/${locale}/${OLD_PROVINCE[locale]}/*`,
    to: `/${locale}/${routes.living[locale]}`,
    status: 301,
  }));
  return [{ from: "/", to: `/${DEFAULT_LOCALE}`, status: 301 }, ...explicit, ...provinceSplats];
}

/**
 * `_redirects` file text (`from to status` per line), with the deploy base prefixed. With an `origin`
 * the destinations are absolute, so a request on any host reaches the final URL in one hop.
 */
export function renderRedirectRules(
  rules: readonly RedirectRule[],
  base = "",
  origin = "",
): string {
  const prefix = base.replace(/\/$/, "");
  const withBase = (path: string): string => (path === "/" ? `${prefix}/` : `${prefix}${path}`);
  const lines = rules.map(
    (rule) => `${withBase(rule.from)} ${origin}${withBase(rule.to)} ${rule.status}`,
  );
  return `${lines.join("\n")}\n`;
}
