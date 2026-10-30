/**
 * Company phone / WhatsApp (AGENTS.md §6 item 16).
 *
 * TODO(ROADMAP I4): NOT CONFIRMED. Value taken from the UI proposal; confirm with the client
 * that 613 084 804 is the general number. This is the ONLY place to change it.
 */
export interface PhoneNumber {
  /** Country calling code without "+". */
  readonly countryCode: string;
  /** National significant number, digits only. */
  readonly nationalNumber: string;
}

export const CONTACT_PHONE: PhoneNumber = { countryCode: "34", nationalNumber: "613084804" };

export function telHref(phone: PhoneNumber): string {
  return `tel:+${phone.countryCode}${phone.nationalNumber}`;
}

export function phoneDisplay(phone: PhoneNumber): string {
  return phone.nationalNumber.replace(/(\d{3})(?=\d)/g, "$1 ");
}

export function whatsappHref(phone: PhoneNumber, message?: string): string {
  const url = new URL(`https://wa.me/${phone.countryCode}${phone.nationalNumber}`);
  if (message !== undefined && message !== "") url.searchParams.set("text", message);
  return url.href;
}

/** General address published in the proposal; the legal notice data remains pending (I11). */
export const COMPANY_EMAIL = "info@housyspace.com";
