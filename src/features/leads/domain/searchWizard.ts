/**
 * Pure rules of the "Mi búsqueda" wizard (reference `demanda.js` + `busco-pasos.js`): the live
 * summary, the zone search and the per-step validation. No DOM here, so it is unit tested and the
 * island stays tiny. Plain functions instead of a Zod schema on purpose: importing Zod in a client
 * script costs about 93 KB gzip, far over the first-load budget (docs/performance.md).
 */

export type Operation = "venta" | "alquiler" | "";

export interface ZoneEntry {
  readonly name: string;
  readonly wholeDistrict: boolean;
  readonly alternative: boolean;
}

export interface SearchState {
  readonly operation: Operation;
  readonly types: readonly string[];
  readonly zones: readonly ZoneEntry[];
  /** Label of the "open to other areas" checkbox when ticked, else "". */
  readonly openToOthers: string;
  readonly priceMin: number | null;
  readonly priceMax: number | null;
  readonly areaMin: number | null;
  readonly areaMax: number | null;
  readonly rooms: string;
  readonly baths: string;
  readonly must: readonly string[];
  readonly nice: readonly string[];
  readonly status: readonly string[];
  readonly term: string;
}

/** Translated words of the summary (`forms.summary` in the dictionaries); `{x}` are placeholders. */
export interface SummaryLabels {
  readonly operation: string;
  readonly type: string;
  readonly zones: string;
  readonly altZones: string;
  readonly otherZones: string;
  readonly budget: string;
  readonly rent: string;
  readonly area: string;
  readonly rooms: string;
  readonly baths: string;
  readonly must: string;
  readonly nice: string;
  readonly status: string;
  readonly term: string;
  readonly buy: string;
  readonly rentOp: string;
  readonly wholeDistrict: string;
  readonly from: string;
  readonly upTo: string;
  readonly between: string;
  readonly orMore: string;
  readonly perMonth: string;
  readonly euro: string;
  readonly squareMetres: string;
  /** Thousands separator of the language ("." or ","). */
  readonly thousands: string;
}

const fill = (template: string, values: Record<string, string>): string =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/** "1.250,50" -> 1250: thousands dots and cents are dropped, anything else is not a number. */
export function parseAmount(raw: string): number | null {
  const digits = raw
    .trim()
    .replace(/[.,]\d{1,2}$/, "")
    .replace(/\D/g, "");
  return digits === "" ? null : Number.parseInt(digits, 10);
}

export function formatAmount(value: number, separator = "."): string {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, separator);
}

function range(min: number | null, max: number | null, unit: string, l: SummaryLabels): string {
  const values = (n: number | null) => ({
    n: n === null ? "" : formatAmount(n, l.thousands),
    u: unit,
  });
  if (min !== null && max !== null && min !== 0 && max !== 0) {
    return fill(l.between, {
      min: formatAmount(min, l.thousands),
      max: formatAmount(max, l.thousands),
      u: unit,
    });
  }
  if (max !== null && max !== 0) return fill(l.upTo, values(max));
  if (min !== null && min !== 0) return fill(l.from, values(min));
  return "";
}

/** Rows of "Así es tu vivienda ideal", in the reference order; empty rows are dropped. */
export function buildSummaryRows(s: SearchState, l: SummaryLabels): [string, string][] {
  const zoneName = (z: ZoneEntry) =>
    z.wholeDistrict ? fill(l.wholeDistrict, { name: z.name }) : z.name;
  const rent = s.operation === "alquiler";
  const rows: [string, string][] = [
    [l.operation, s.operation === "venta" ? l.buy : rent ? l.rentOp : ""],
    [l.type, s.types.join(", ")],
    [
      l.zones,
      s.zones
        .filter((z) => !z.alternative)
        .map(zoneName)
        .join(" · "),
    ],
    [
      l.altZones,
      s.zones
        .filter((z) => z.alternative)
        .map(zoneName)
        .join(" · "),
    ],
    [l.otherZones, s.openToOthers],
    [rent ? l.rent : l.budget, range(s.priceMin, s.priceMax, rent ? l.perMonth : l.euro, l)],
    [l.area, range(s.areaMin, s.areaMax, l.squareMetres, l)],
    [l.rooms, s.rooms === "" ? "" : fill(l.orMore, { n: s.rooms })],
    [l.baths, s.baths === "" ? "" : fill(l.orMore, { n: s.baths })],
    [l.must, s.must.join(", ")],
    [l.nice, s.nice.join(", ")],
    [l.status, s.status.join(", ")],
    [l.term, s.term],
  ];
  return rows.filter(([, value]) => value !== "");
}

export interface ZoneIndexEntry {
  readonly kind: "district" | "barrio";
  readonly value: string;
  readonly name: string;
  /** Normalised name plus its district, what the query is matched against. */
  readonly key: string;
}

/** Lowercase, no accents, words separated by single spaces. */
export function normalise(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Up to 8 zones matching every word of the query; exact and prefix matches first, districts win ties. */
export function searchZones(
  index: readonly ZoneIndexEntry[],
  query: string,
): readonly ZoneIndexEntry[] {
  const words = normalise(query).split(" ").filter(Boolean);
  if (words.length === 0) return [];
  const scored: { entry: ZoneIndexEntry; score: number }[] = [];
  for (const entry of index) {
    const name = normalise(entry.name);
    if (!words.every((word) => entry.key.includes(word))) continue;
    let score = entry.kind === "district" ? 1 : 0;
    for (const word of words) {
      score +=
        name === word
          ? 6
          : name.startsWith(word)
            ? 4
            : name.includes(` ${word}`)
              ? 3
              : name.includes(word)
                ? 2
                : 1;
    }
    scored.push({ entry, score: score - name.length / 1000 });
  }
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(({ entry }) => entry);
}

export type FieldKey =
  "operation" | "price" | "area" | "name" | "email" | "phone" | "consentData" | "channels";

export interface FormValues {
  readonly operation: string;
  readonly priceMin: number | null;
  readonly priceMax: number | null;
  readonly areaMin: number | null;
  readonly areaMax: number | null;
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly consentData: boolean;
  readonly commercial: boolean;
  readonly channels: readonly string[];
}

const STEP_FIELDS: readonly (readonly FieldKey[])[] = [
  ["operation"],
  [],
  ["price"],
  ["area"],
  ["name", "email", "phone", "consentData", "channels"],
];

/** Fields checked when leaving a step (the reference validates operation, budget and area on "Next"). */
export function stepFields(step: number): readonly FieldKey[] {
  return STEP_FIELDS[step] ?? [];
}

const RULES: Record<FieldKey, (v: FormValues) => boolean> = {
  operation: (v) => v.operation !== "",
  price: (v) => !(v.priceMin !== null && v.priceMax !== null && v.priceMin > v.priceMax),
  area: (v) => !(v.areaMin !== null && v.areaMax !== null && v.areaMin > v.areaMax),
  name: (v) => v.name.trim().length >= 2,
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim()),
  phone: (v) => {
    const digits = v.phone.replace(/\D/g, "").length;
    return /^\+?[\d\s().-]{9,22}$/.test(v.phone.trim()) && digits >= 9 && digits <= 15;
  },
  consentData: (v) => v.consentData,
  channels: (v) => !v.commercial || v.channels.length > 0,
};

/** Failing fields of the given steps, in form order (the first one gets the focus). */
export function invalidFields(v: FormValues, steps: readonly number[]): FieldKey[] {
  return steps.flatMap((step) => stepFields(step)).filter((key) => !RULES[key](v));
}
