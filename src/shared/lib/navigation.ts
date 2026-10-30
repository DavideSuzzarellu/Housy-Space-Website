import { DISTRICTS } from "@/features/districts/domain/districts";
import { getDictionary } from "@/shared/i18n";
import type { Locale } from "@/shared/i18n/config";
import { getLocalizedPath, withUrlExtras } from "@/shared/i18n/routes";
import { getServiceSlug, SERVICE_KEYS } from "@/shared/i18n/services";

/** Navigation model shared by the header, the mobile drawer and the footer (one source). */
export interface NavLink {
  readonly label: string;
  readonly href: string;
}

export interface NavItem extends NavLink {
  /** Submenu links; empty for plain entries. */
  readonly children: readonly NavLink[];
  /** Shown as one smaller row at the end of the drawer (UI proposal v3); the header lists it as usual. */
  readonly secondary: boolean;
}

export interface NavColumn {
  readonly title: string;
  readonly links: readonly NavLink[];
}

export function getMainNavigation(locale: Locale): NavItem[] {
  const { nav, serviceNames } = getDictionary(locale);
  const sale = getLocalizedPath("sale", locale);
  const living = getLocalizedPath("living", locale);
  return [
    {
      label: nav.properties,
      href: sale,
      // TODO: AGENTS.md §4.1 has no "all properties" catalog route; the sale listing stands in.
      children: [
        { label: nav.allProperties, href: sale },
        { label: nav.forSale, href: sale },
        { label: nav.forRent, href: getLocalizedPath("rent", locale) },
        { label: nav.onMap, href: withUrlExtras(sale, { query: { vista: "mapa" } }) },
      ],
      secondary: false,
    },
    {
      label: nav.services,
      href: withUrlExtras(getLocalizedPath("home", locale), { hash: "servicios" }),
      children: SERVICE_KEYS.map((service) => ({
        label: serviceNames[service],
        href: getLocalizedPath("serviceDetail", locale, {
          service: getServiceSlug(service, locale),
        }),
      })),
      secondary: false,
    },
    {
      label: nav.living,
      href: living,
      children: [
        { label: nav.neighbourhoodSearch, href: living },
        ...DISTRICTS.map((district) => ({
          label: district.name,
          href: getLocalizedPath("district", locale, { district: district.slug }),
        })),
      ],
      secondary: false,
    },
    {
      label: nav.homeSearch,
      href: getLocalizedPath("homeSearch", locale),
      children: [],
      secondary: false,
    },
    { label: nav.about, href: getLocalizedPath("about", locale), children: [], secondary: true },
    { label: nav.blog, href: getLocalizedPath("blog", locale), children: [], secondary: true },
    {
      label: nav.contact,
      href: getLocalizedPath("contact", locale),
      children: [],
      secondary: true,
    },
  ];
}

export function getFooterNavigation(locale: Locale): NavColumn[] {
  const { nav, footer } = getDictionary(locale);
  return [
    {
      title: footer.columns.explore,
      links: [
        { label: nav.properties, href: getLocalizedPath("sale", locale) },
        {
          label: nav.services,
          href: withUrlExtras(getLocalizedPath("home", locale), { hash: "servicios" }),
        },
        { label: nav.living, href: getLocalizedPath("living", locale) },
        { label: nav.homeSearch, href: getLocalizedPath("homeSearch", locale) },
        { label: footer.links.blog, href: getLocalizedPath("blog", locale) },
      ],
    },
    {
      title: footer.columns.owners,
      links: [
        {
          label: nav.sell,
          href: getLocalizedPath("serviceDetail", locale, {
            service: getServiceSlug("saleBrokerage", locale),
          }),
        },
        { label: footer.links.customSearch, href: getLocalizedPath("customSearch", locale) },
        {
          label: footer.links.internationalBuyers,
          href: getLocalizedPath("internationalGuide", locale),
        },
      ],
    },
    {
      title: footer.columns.company,
      links: [
        { label: nav.about, href: getLocalizedPath("about", locale) },
        { label: nav.contact, href: getLocalizedPath("contact", locale) },
        { label: footer.links.dataStatus, href: getLocalizedPath("dataSources", locale) },
        { label: footer.links.legalNotice, href: getLocalizedPath("legalNotice", locale) },
        { label: footer.links.privacy, href: getLocalizedPath("privacy", locale) },
        { label: footer.links.cookies, href: getLocalizedPath("cookies", locale) },
      ],
    },
  ];
}
