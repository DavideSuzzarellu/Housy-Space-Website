import type { Company } from "@/features/agency/domain/company";
import type { Locale } from "@/shared/i18n/config";
import { compactJsonLd, type JsonLdObject, type JsonValue } from "@/shared/lib/seo/jsonLd";
import {
  getOperationPrice,
  getPropertyTitle,
  localize,
  type DetailOperation,
  type Property,
} from "../domain/property";

export interface PropertyJsonLdInput {
  readonly property: Property;
  readonly operation: DetailOperation;
  readonly locale: Locale;
  /** Absolute canonical URL of the detail page. */
  readonly url: string;
  /** Absolute site origin (`Astro.site`). */
  readonly siteUrl: string;
  readonly company: Company;
}

/** Spanish Mobilia type names that are apartments (schema.org `Apartment`). */
const APARTMENT_TYPE = /\b(piso|apartamento|[aá]tico|estudio|d[uú]plex|loft)/i;
const MAX_DESCRIPTION = 500;
const COUNTRY = "ES";

const BUSINESS_FUNCTION = {
  sale: "http://purl.org/goodrelations/v1#Sell",
  rent: "http://purl.org/goodrelations/v1#LeaseOut",
} as const satisfies Record<DetailOperation, string>;

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), 0)) || cut}…`;
}

function residenceType(property: Property): "Apartment" | "Residence" {
  return APARTMENT_TYPE.test(property.propertyType.es ?? "") ? "Apartment" : "Residence";
}

/** Privacy (§5): locality only. Never a street or coordinates, not even the zone centre. */
function addressOf(property: Property): JsonLdObject {
  return {
    "@type": "PostalAddress",
    addressLocality: property.location?.city,
    addressCountry: COUNTRY,
  };
}

function sellerOf(company: Company, siteUrl: string): JsonLdObject {
  return {
    "@type": "RealEstateAgent",
    name: company.legalName,
    url: siteUrl,
    address: {
      "@type": "PostalAddress",
      streetAddress: company.address.street,
      postalCode: company.address.postalCode,
      addressLocality: company.address.city,
      addressCountry: COUNTRY,
    },
  };
}

/**
 * Structured data of a property detail page: the dwelling (`Apartment`/`Residence`) and its
 * `Offer` (price only when public, EUR, availability) sold by the agency (`RealEstateAgent`).
 * Only confirmed data; unknown fields are left out (§8, skill seo-multilingual).
 */
export function buildPropertyJsonLd(input: PropertyJsonLdInput): JsonLdObject {
  const { property, operation, locale, url, siteUrl, company } = input;
  const type = residenceType(property);
  const id = `${url}#property`;
  const description = localize(property.summary, locale) ?? localize(property.description, locale);
  const isApartment = type === "Apartment";

  const residence: JsonLdObject = {
    "@type": type,
    "@id": id,
    name: getPropertyTitle(property, locale),
    description: description === undefined ? undefined : truncate(description, MAX_DESCRIPTION),
    url,
    image: property.photos.map((photo) => photo.url),
    address: addressOf(property),
    numberOfBedrooms: isApartment ? property.bedrooms : undefined,
    numberOfBathroomsTotal: isApartment ? property.bathrooms : undefined,
    floorSize:
      isApartment && property.builtArea !== undefined
        ? { "@type": "QuantitativeValue", value: property.builtArea, unitCode: "MTK" }
        : undefined,
  };

  const price = getOperationPrice(property, operation);
  const amount = price?.kind === "amount" ? price.amount : undefined;
  const offer: JsonLdObject = {
    "@type": "Offer",
    url,
    businessFunction: BUSINESS_FUNCTION[operation],
    price: amount,
    priceCurrency: amount === undefined ? undefined : "EUR",
    priceSpecification:
      amount !== undefined && operation === "rent"
        ? {
            "@type": "UnitPriceSpecification",
            price: amount,
            priceCurrency: "EUR",
            unitCode: "MON",
          }
        : undefined,
    availability:
      property.status === "reserved"
        ? "https://schema.org/LimitedAvailability"
        : "https://schema.org/InStock",
    itemOffered: { "@id": id },
    seller: sellerOf(company, siteUrl),
  };

  const graph: JsonValue[] = [residence, offer];
  return compactJsonLd({ "@context": "https://schema.org", "@graph": graph });
}
