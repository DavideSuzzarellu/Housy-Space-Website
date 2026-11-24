import { compactJsonLd, type JsonLdObject, type JsonValue } from "./jsonLd";

/**
 * Typed schema.org builders (AGENTS.md §1, §8). Only confirmed company data goes in: legal name,
 * CIF, AICAT, the office address and the domain. No phone, e-mail, opening hours, ratings or
 * social profiles until the client confirms them (ROADMAP I4). Pages pass what they already show.
 */

/** The confirmed company fields these builders read (`COMPANY` satisfies it). */
export interface SeoCompany {
  readonly legalName: string;
  readonly brandName: string;
  readonly taxId: string;
  readonly aicatNumber: string;
  readonly address: {
    readonly street: string;
    readonly postalCode: string;
    readonly city: string;
  };
}

const CONTEXT = "https://schema.org";
const COUNTRY = "ES";
/** Public brand name of the agency (the legal name is `legalName`). */
export const BRAND_NAME = "HousySpace";
/** Logo PNG in `public/`: the Open Graph image of pages without a photo and the schema.org logo. */
export const LOGO_PNG_FILE = "brand/housyspace-logo-oficial-fondo-blanco-3000.png";

/** Site root URL including the deploy base and no trailing slash: `https://host` or `https://host/base`. */
export function getSiteUrl(site: URL, base: string): string {
  return new URL(base, site).href.replace(/\/$/, "");
}

/** Root-relative URL of a file in `public/`, whether `base` ends with a slash or not. */
export function publicPath(base: string, file: string): string {
  return `${base.replace(/\/$/, "")}/${file}`;
}

/** Absolute URL of a root-relative path that already carries the base (from `getLocalizedPath`). */
export function toAbsoluteUrl(path: string, site: URL): string {
  return new URL(path, site).href;
}

export const organizationId = (siteUrl: string): string => `${siteUrl}/#organization`;
export const websiteId = (siteUrl: string): string => `${siteUrl}/#website`;

export function organizationNode(input: {
  readonly siteUrl: string;
  readonly company: SeoCompany;
  /** Absolute URL of the logo PNG. */
  readonly logoUrl: string;
}): JsonLdObject {
  const { siteUrl, company, logoUrl } = input;
  return {
    "@type": "RealEstateAgent",
    "@id": organizationId(siteUrl),
    name: BRAND_NAME,
    alternateName: company.brandName,
    legalName: company.legalName,
    url: siteUrl,
    logo: logoUrl,
    taxID: company.taxId,
    identifier: {
      "@type": "PropertyValue",
      name: "AICAT",
      value: company.aicatNumber,
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: company.address.street,
      postalCode: company.address.postalCode,
      addressLocality: company.address.city,
      addressCountry: COUNTRY,
    },
    areaServed: { "@type": "City", name: company.address.city },
  };
}

export function websiteNode(input: {
  readonly siteUrl: string;
  /** BCP 47 tags of every language version. */
  readonly languages: readonly string[];
}): JsonLdObject {
  const { siteUrl, languages } = input;
  return {
    "@type": "WebSite",
    "@id": websiteId(siteUrl),
    url: siteUrl,
    name: BRAND_NAME,
    inLanguage: [...languages],
    publisher: { "@id": organizationId(siteUrl) },
  };
}

export interface BreadcrumbItem {
  readonly name: string;
  /** Absolute URL. */
  readonly url: string;
}

export function breadcrumbNode(items: readonly BreadcrumbItem[], id: string): JsonLdObject {
  return {
    "@type": "BreadcrumbList",
    "@id": id,
    itemListElement: items.map((item, index): JsonLdObject => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export interface FaqEntry {
  readonly question: string;
  readonly answer: string;
}

/** Only for questions that are visible on the page (Google policy): the caller passes exactly those. */
export function faqNode(entries: readonly FaqEntry[]): JsonLdObject {
  return {
    "@type": "FAQPage",
    mainEntity: entries.map((entry): JsonLdObject => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: { "@type": "Answer", text: entry.answer },
    })),
  };
}

export interface PlaceInput {
  readonly kind: "district" | "barrio";
  readonly name: string;
  readonly cityName: string;
  /** Name of the district a barrio belongs to. */
  readonly districtName?: string;
  readonly description: string;
}

/** Name, description and containing area only: no coordinates and no figures (they live on the page). */
export function placeNode(input: PlaceInput, url: string): JsonLdObject {
  const { kind, name, cityName, districtName, description } = input;
  return {
    "@type": "AdministrativeArea",
    "@id": `${url}#place`,
    name,
    description,
    url,
    containedInPlace:
      kind === "barrio" && districtName !== undefined
        ? {
            "@type": "AdministrativeArea",
            name: districtName,
            containedInPlace: { "@type": "City", name: cityName },
          }
        : { "@type": "City", name: cityName },
  };
}

export type WebPageType = "WebPage" | "AboutPage" | "ContactPage" | "CollectionPage";

export interface PageJsonLdInput {
  readonly siteUrl: string;
  /** Absolute canonical URL of the page. */
  readonly url: string;
  /** BCP 47 tag of the page language. */
  readonly language: string;
  readonly name: string;
  readonly description: string;
  readonly pageType?: WebPageType;
  /** Visible breadcrumb trail, last item = this page. Omit on the home page. */
  readonly breadcrumbs?: readonly BreadcrumbItem[];
  /** The page is a service offered by the agency. */
  readonly service?: { readonly name: string };
  readonly faq?: readonly FaqEntry[];
  readonly place?: PlaceInput;
}

function graphOf(nodes: readonly (JsonLdObject | undefined)[]): JsonLdObject {
  const graph = nodes.filter((node): node is JsonLdObject => node !== undefined);
  return compactJsonLd({ "@context": CONTEXT, "@graph": graph satisfies JsonValue[] });
}

/**
 * Structured data of any page except home and property detail: the page itself, its visible
 * breadcrumb trail and, when the page really is one, a Service, a visible FAQ or a Place.
 * The organisation is referenced by `@id` (it is described once, on the home page).
 */
export function buildPageJsonLd(input: PageJsonLdInput): JsonLdObject {
  const { siteUrl, url, language, name, description, breadcrumbs, service, faq, place } = input;
  const breadcrumbId = `${url}#breadcrumb`;
  const hasTrail = breadcrumbs !== undefined && breadcrumbs.length > 0;
  return graphOf([
    {
      "@type": input.pageType ?? "WebPage",
      "@id": url,
      url,
      name,
      description,
      inLanguage: language,
      isPartOf: { "@id": websiteId(siteUrl) },
      breadcrumb: hasTrail ? { "@id": breadcrumbId } : undefined,
      about: place === undefined ? undefined : { "@id": `${url}#place` },
    },
    hasTrail ? breadcrumbNode(breadcrumbs, breadcrumbId) : undefined,
    service === undefined
      ? undefined
      : {
          "@type": "Service",
          "@id": `${url}#service`,
          name: service.name,
          description,
          url,
          provider: { "@id": organizationId(siteUrl) },
          areaServed: { "@type": "City", name: "Barcelona" },
        },
    faq === undefined || faq.length === 0 ? undefined : faqNode(faq),
    place === undefined ? undefined : placeNode(place, url),
  ]);
}

/** Home page: the agency (described once, referenced elsewhere) and the website. */
export function buildHomeJsonLd(input: {
  readonly siteUrl: string;
  readonly company: SeoCompany;
  readonly logoUrl: string;
  readonly languages: readonly string[];
}): JsonLdObject {
  const { siteUrl, company, logoUrl, languages } = input;
  return graphOf([
    organizationNode({ siteUrl, company, logoUrl }),
    websiteNode({ siteUrl, languages }),
  ]);
}
