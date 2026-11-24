/**
 * Guard for market figures quoted in free text (blog articles): a "€/m²" or "€/mes" figure must be
 * a value of the official `market` data, never an estimate (AGENTS.md §6.2). Pure.
 */

export type FigureUnit = "perM2" | "perMonth";

export interface QuotedFigure {
  readonly value: number;
  readonly unit: FigureUnit;
  /** The text as written, for messages. */
  readonly raw: string;
}

export interface AllowedFigures {
  readonly perM2: readonly number[];
  readonly perMonth: readonly number[];
}

const NUMBER = String.raw`\d{1,3}(?:[.,\u00a0\u202f]\d{3})+(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?`;
const QUOTED = new RegExp(
  String.raw`(${NUMBER})\s*(?:€|euros?)\s*(?:\/|por\s+|al\s+|per\s+)\s*(m²|m2|mes|month|mese)(?![\p{L}\p{N}])`,
  "giu",
);

/** "4.254" / "4,254" / "4254" → 4254; "18,13" → 18.13 (3 digits after a separator = thousands). */
function parseNumber(raw: string): number {
  const compact = raw.replace(/[\u00a0\u202f]/g, "");
  const decimal = /^(.*?)[.,](\d{1,2})$/.exec(compact);
  const integerPart = (decimal?.[1] ?? compact).replace(/[.,]/g, "");
  return Number(decimal?.[2] === undefined ? integerPart : `${integerPart}.${decimal[2]}`);
}

export function extractQuotedFigures(text: string): QuotedFigure[] {
  return [...text.matchAll(QUOTED)].map((match) => ({
    value: parseNumber(match[1] ?? ""),
    unit: /m[²2]$/i.test(match[2] ?? "") ? "perM2" : "perMonth",
    raw: match[0],
  }));
}

/** An integer figure may be a rounded market value; a decimal one must match exactly. */
export function isKnownFigure(figure: QuotedFigure, allowed: AllowedFigures): boolean {
  const values = figure.unit === "perM2" ? allowed.perM2 : allowed.perMonth;
  return Number.isInteger(figure.value)
    ? values.some((value) => Math.round(value) === figure.value)
    : values.some((value) => Math.abs(value - figure.value) < 0.005);
}

export function unknownFigures(text: string, allowed: AllowedFigures): QuotedFigure[] {
  return extractQuotedFigures(text).filter((figure) => !isKnownFigure(figure, allowed));
}
