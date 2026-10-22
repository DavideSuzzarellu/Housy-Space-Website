import { LOCALE_META, type Locale } from "@/shared/i18n/config";

/** Single place for user-facing number, price and message formatting (AGENTS.md §3.1). */

const priceFormatters = new Map<Locale, Intl.NumberFormat>();
const numberFormatters = new Map<Locale, Intl.NumberFormat>();

function priceFormatter(locale: Locale): Intl.NumberFormat {
  let formatter = priceFormatters.get(locale);
  if (formatter === undefined) {
    formatter = new Intl.NumberFormat(LOCALE_META[locale].langTag, {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
      // Spanish CLDR skips grouping for 4-digit numbers; always group for consistency.
      useGrouping: "always",
    });
    priceFormatters.set(locale, formatter);
  }
  return formatter;
}

export function formatPrice(amountEur: number, locale: Locale): string {
  return priceFormatter(locale).format(amountEur);
}

export function formatNumber(value: number, locale: Locale): string {
  let formatter = numberFormatters.get(locale);
  if (formatter === undefined) {
    formatter = new Intl.NumberFormat(LOCALE_META[locale].langTag, { useGrouping: "always" });
    numberFormatters.set(locale, formatter);
  }
  return formatter.format(value);
}

/** Fills `{name}` placeholders of an i18n string. Missing values are a programming error. */
export function formatMessage(
  template: string,
  values: Readonly<Record<string, string | number>>,
): string {
  return template.replace(/\{([a-zA-Z]+)\}/g, (_match, name: string) => {
    const value = values[name];
    if (value === undefined) throw new RangeError(`formatMessage: missing value for "${name}"`);
    return String(value);
  });
}
