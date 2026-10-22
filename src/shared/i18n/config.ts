/**
 * Single source of truth for supported locales.
 * `astro.config.ts` imports these constants, so the `Locale` union below
 * is derived from the same values Astro uses for i18n routing.
 */
export const LOCALES = ["es", "en", "it", "ca"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE = "es" satisfies Locale;

export interface LocaleMeta {
  /** BCP 47 tag used for `<html lang>`, `hreflang` and the sitemap. */
  readonly langTag: string;
  /** Open Graph locale (`og:locale`). */
  readonly ogLocale: string;
}

export const LOCALE_META = {
  es: { langTag: "es-ES", ogLocale: "es_ES" },
  en: { langTag: "en", ogLocale: "en_GB" },
  it: { langTag: "it-IT", ogLocale: "it_IT" },
  ca: { langTag: "ca-ES", ogLocale: "ca_ES" },
} as const satisfies Record<Locale, LocaleMeta>;

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}
