import type { ServiceKey } from "@/shared/i18n/services";

/**
 * Home services carousel: order of the panels and the light tint of each open card, taken
 * from the colour of its illustration so the picture melts into the card (reference `--hs-cl`).
 */
export const SERVICE_PANELS: readonly { readonly service: ServiceKey; readonly tint: string }[] = [
  { service: "saleBrokerage", tint: "#faf4f1" },
  { service: "valuation", tint: "#f8f2ef" },
  { service: "legalTax", tint: "#fbf9f6" },
  { service: "renovations", tint: "#f9f4f0" },
  { service: "advisory", tint: "#fbf8f6" },
  { service: "financial", tint: "#f9f5f2" },
  { service: "personalShopper", tint: "#f9f5f2" },
  { service: "investment", tint: "#fbf7f3" },
  { service: "rentalManagement", tint: "#faf7f5" },
];
