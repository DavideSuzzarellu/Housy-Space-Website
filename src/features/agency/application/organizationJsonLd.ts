import type { Company } from "@/features/agency/domain/company";
import type { JsonLdObject } from "@/shared/lib/seo/jsonLd";

const COUNTRY = "ES";

/**
 * The agency as schema.org `RealEstateAgent`, from confirmed company data only (AGENTS.md §1).
 * One definition for every structured-data block that names the organization.
 */
export function organizationJsonLd(company: Company, siteUrl: string): JsonLdObject {
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
