import type { Locale } from "./config";
import ca from "./ca";
import en from "./en";
import es, { type Dictionary } from "./es";
import it from "./it";

export type { Dictionary } from "./es";
export { DEFAULT_LOCALE, LOCALE_META, LOCALES, isLocale, type Locale } from "./config";

const dictionaries = { es, en, it, ca } as const satisfies Record<Locale, Dictionary>;

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
