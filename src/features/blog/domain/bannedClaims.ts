import type { Locale } from "@/shared/i18n/config";
import { containsPhrase } from "./text";

/**
 * Promises the agency must never make in an article (no guaranteed results, no unsupported
 * superlatives, no "risk-free"; skills housyspace-seo and legal-tax-auditor §13). Defined once,
 * per language, matched as whole words ignoring case and accents. Add a phrase here and every
 * article check picks it up.
 */
export const BANNED_CLAIMS = {
  es: [
    "rentabilidad asegurada",
    "garantizado",
    "garantizada",
    "sin riesgo",
    "sin ningun riesgo",
    "el mejor precio",
    "precio garantizado",
    "venta garantizada",
  ],
  en: [
    "guaranteed return",
    "guaranteed",
    "risk-free",
    "no risk",
    "the best price",
    "guaranteed price",
    "guaranteed sale",
  ],
  it: [
    "rendimento garantito",
    "garantito",
    "garantita",
    "senza rischio",
    "il miglior prezzo",
    "prezzo garantito",
    "vendita garantita",
  ],
  ca: [
    "rendibilitat assegurada",
    "garantit",
    "garantida",
    "sense risc",
    "el millor preu",
    "preu garantit",
    "venda garantida",
  ],
} as const satisfies Record<Locale, readonly string[]>;

/**
 * The banned phrases present in `text`, longest phrases first. A phrase that is only the tail of a
 * longer banned one ("garantizado" inside "precio garantizado") is reported once, as the longer.
 */
export function findBannedClaims(text: string, language: Locale): string[] {
  const found = BANNED_CLAIMS[language]
    .filter((phrase) => containsPhrase(text, phrase))
    .sort((a, b) => b.length - a.length);
  return found.filter(
    (phrase, index) =>
      !found.slice(0, index).some((longer) => longer !== phrase && longer.includes(phrase)),
  );
}
