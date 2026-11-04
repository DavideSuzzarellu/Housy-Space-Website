import type { ImageMetadata } from "astro";
import { getDictionary } from "@/shared/i18n";
import { DEFAULT_LOCALE, type Locale } from "@/shared/i18n/config";
import { getLocalizedPath } from "@/shared/i18n/routes";
import { getServiceSlug, type ServiceKey } from "@/shared/i18n/services";
import { getPage } from "./pages";

/**
 * Services index: the main services first, then "other services" (services board of the design
 * canvas, adapted to the 9 services of proposal v3).
 */
export const SERVICE_GROUPS = {
  main: ["saleBrokerage", "rentalManagement", "personalShopper", "renovations", "advisory"],
  others: ["valuation", "investment", "legalTax", "financial"],
} as const satisfies Record<string, readonly ServiceKey[]>;

export interface ServiceCard {
  readonly key: ServiceKey;
  readonly name: string;
  readonly description: string;
  readonly image: ImageMetadata;
  readonly href: string;
}

/** One card per service, from its own page: name, description and head photo (no copies). */
export async function getServiceCard(key: ServiceKey, locale: Locale): Promise<ServiceCard> {
  const page = await getPage(`service-${getServiceSlug(key, DEFAULT_LOCALE)}`, locale);
  const image = page.content.head.items.find((item) => item.kind === "image");
  if (image === undefined) throw new Error(`Service "${key}" has no head image`);
  return {
    key,
    name: getDictionary(locale).serviceNames[key],
    description: page.content.description,
    image: image.src,
    href: getLocalizedPath("serviceDetail", locale, { service: getServiceSlug(key, locale) }),
  };
}

export async function getServiceCards(
  locale: Locale,
): Promise<{ readonly main: ServiceCard[]; readonly others: ServiceCard[] }> {
  const cardsOf = (keys: readonly ServiceKey[]) =>
    Promise.all(keys.map((key) => getServiceCard(key, locale)));
  return { main: await cardsOf(SERVICE_GROUPS.main), others: await cardsOf(SERVICE_GROUPS.others) };
}
