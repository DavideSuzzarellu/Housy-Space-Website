import type { ImageMetadata } from "astro";
import financial from "@/assets/home/services/financial.webp";
import investment from "@/assets/home/services/investment.webp";
import legalTax from "@/assets/home/services/legal-tax.webp";
import personalShopper from "@/assets/home/services/personal-shopper.webp";
import renovations from "@/assets/home/services/renovations.webp";
import rental from "@/assets/home/services/rental.webp";
import sale from "@/assets/home/services/sale.webp";
import valuation from "@/assets/home/services/valuation.webp";
import type { ServiceKey } from "@/shared/i18n/services";

/** Thumbnail of each service (home carousel and services index). */
export const SERVICE_IMAGES: Record<ServiceKey, ImageMetadata> = {
  saleBrokerage: sale,
  valuation,
  legalTax,
  renovations,
  financial,
  personalShopper,
  investment,
  rentalManagement: rental,
};
