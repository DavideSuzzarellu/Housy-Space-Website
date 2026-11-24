import type { MarketData } from "@/features/districts/infrastructure/marketSchema";

/** Pure logic of the district map (reference `vivir7.js`): colour buckets, label anchors, panel figures. */

export const TONES = 7;
/** From this tone the label is light (rampContrast.test.ts computes the contrast). */
export const LIGHT_FROM = 4;
export const METRIC_KEYS = ["sale", "rent", "density"] as const;
export type MetricKey = (typeof METRIC_KEYS)[number];

export interface MapViewBox {
  readonly width: number;
  readonly height: number;
}
export interface Bounds {
  readonly x0: number;
  readonly y0: number;
  readonly x1: number;
  readonly y1: number;
}

/** Quantile bucket of `value` among `values` (reference `computeBreaks` + `tono`); -1 when missing. */
export function toneOf(values: readonly number[], value: number | null, tones: number): number {
  if (value === null) return -1;
  const sorted = [...values].sort((a, b) => a - b);
  let tone = 0;
  for (let i = 1; i < tones; i += 1) {
    const edge = sorted[Math.min(sorted.length - 1, Math.floor((i * sorted.length) / tones))];
    if (edge !== undefined && value >= edge) tone += 1;
  }
  return tone;
}

type Point = readonly [number, number];
const rings = (d: string): Point[][] =>
  d
    .split("M")
    .filter((part) => part.trim() !== "")
    .map((part) => {
      const numbers = (part.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
      const points: Point[] = [];
      for (let i = 0; i + 1 < numbers.length; i += 2) {
        points.push([numbers[i] ?? 0, numbers[i + 1] ?? 0]);
      }
      return points;
    });

export function pathBounds(d: string): Bounds {
  const all = rings(d).flat();
  const xs = all.map(([x]) => x);
  const ys = all.map(([, y]) => y);
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
}

/** Area centroid of the largest ring (the mainland of a district made of several polygons). */
export function pathCentroid(d: string): { x: number; y: number } {
  let best = { area: -1, x: 0, y: 0 };
  for (const ring of rings(d)) {
    let twice = 0;
    let cx = 0;
    let cy = 0;
    ring.forEach(([x1, y1], i) => {
      const [x2, y2] = ring[(i + 1) % ring.length] ?? [x1, y1];
      const cross = x1 * y2 - x2 * y1;
      twice += cross;
      cx += (x1 + x2) * cross;
      cy += (y1 + y2) * cross;
    });
    const area = Math.abs(twice) / 2;
    if (area > best.area && twice !== 0) {
      best = { area, x: cx / (3 * twice), y: cy / (3 * twice) };
    }
  }
  return { x: best.x, y: best.y };
}

/** One line, or two balanced ones when the name is long (reference `drawLabels`). */
export function labelLines(name: string): string[] {
  const words = name.split(" ");
  if (name.length <= 13 || words.length < 2) return [name];
  let best = 0;
  let distance = Infinity;
  let run = 0;
  words.forEach((word, i) => {
    run += word.length + 1;
    const gap = Math.abs(run - (name.length + 1) / 2);
    if (i < words.length - 1 && gap < distance) {
      distance = gap;
      best = i;
    }
  });
  return [words.slice(0, best + 1).join(" "), words.slice(best + 1).join(" ")];
}

/** Uppercase Montserrat is ~0.72 em per character with the heading tracking. */
const EM_PER_CHAR = 0.72;

/** A label is kept when it is at most 1.5 times as wide as its district (reference rule). */
export function labelFits(
  lines: readonly string[],
  box: Bounds,
  viewBox: MapViewBox,
  stagePx: number,
  fontPx: number,
): boolean {
  const widest = Math.max(...lines.map((line) => line.length));
  const districtPx = ((box.x1 - box.x0) / viewBox.width) * stagePx;
  return widest * EM_PER_CHAR * fontPx <= districtPx * 1.5;
}

export interface MapMetric {
  readonly value: number | null;
  readonly year: number | null;
  /** Colour tone 0-6, -1 when the figure is not available. */
  readonly tone: number;
  /** 1 = highest of the 10 districts. */
  readonly rank: number | null;
}
export interface MapDistrict {
  readonly slug: string;
  readonly name: string;
  readonly d: string;
  /** Label anchor in percent of the map. */
  readonly left: number;
  readonly top: number;
  readonly lines: readonly string[];
  readonly fitsWide: boolean;
  readonly fitsNarrow: boolean;
  readonly barrioCount: number;
  readonly population: number;
  readonly metrics: Readonly<Record<MetricKey, MapMetric>>;
}
export interface DistrictMapModel {
  readonly viewBox: MapViewBox;
  readonly districts: readonly MapDistrict[];
  readonly population: number;
  readonly barrioCount: number;
  readonly city: Readonly<Record<MetricKey, { value: number | null; year: number | null }>>;
  readonly range: Readonly<Record<MetricKey, { min: number; max: number }>>;
}

const lastYear = (series: readonly (readonly [number, number])[]): number | null =>
  series.at(-1)?.[0] ?? null;

/** Stage widths (px) of the map on desktop and on a phone, and the label size on each. */
const WIDE = { stage: 636, font: 9.3 } as const;
const NARROW = { stage: 330, font: 9 } as const;

export function buildDistrictMap(
  market: MarketData,
  shapes: { readonly viewBox: string; readonly districts: Readonly<Record<string, string>> },
): DistrictMapModel {
  const [, , w = "1000", h = "1148"] = shapes.viewBox.split(" ");
  const viewBox = { width: Number(w), height: Number(h) };
  const years: Record<MetricKey, number | null> = {
    sale: lastYear(market.city.saleSeries),
    rent: lastYear(market.city.rentSeries),
    density: market.barrios[0]?.densityYear ?? null,
  };
  const all: Record<MetricKey, number[]> = {
    sale: market.districts.map((district) => district.sale),
    rent: market.districts.map((district) => district.rent),
    density: market.districts.map((district) => district.density),
  };
  const districts = market.districts.flatMap((district): MapDistrict[] => {
    const d = shapes.districts[district.slug];
    if (d === undefined) return [];
    const centre = pathCentroid(d);
    const box = pathBounds(d);
    const lines = labelLines(district.name);
    const metric = (key: MetricKey): MapMetric => {
      const value = district[key];
      const descending = [...all[key]].sort((a, b) => b - a);
      return {
        value,
        year: years[key],
        tone: toneOf(all[key], value, TONES),
        rank: descending.indexOf(value) + 1,
      };
    };
    return [
      {
        slug: district.slug,
        name: district.name,
        d,
        left: (centre.x / viewBox.width) * 100,
        top: (centre.y / viewBox.height) * 100,
        lines,
        fitsWide: labelFits(lines, box, viewBox, WIDE.stage, WIDE.font),
        fitsNarrow: labelFits(lines, box, viewBox, NARROW.stage, NARROW.font),
        barrioCount: district.barrioCount,
        population: district.population,
        metrics: { sale: metric("sale"), rent: metric("rent"), density: metric("density") },
      },
    ];
  });
  const range = (key: MetricKey) => ({ min: Math.min(...all[key]), max: Math.max(...all[key]) });
  return {
    viewBox,
    districts,
    population: districts.reduce((sum, district) => sum + district.population, 0),
    barrioCount: districts.reduce((sum, district) => sum + district.barrioCount, 0),
    city: {
      sale: { value: market.city.sale, year: years.sale },
      rent: { value: market.city.rent, year: years.rent },
      density: { value: market.city.density, year: years.density },
    },
    range: { sale: range("sale"), rent: range("rent"), density: range("density") },
  };
}

export interface BarrioMapItem {
  readonly slug: string;
  readonly name: string;
  readonly d: string;
  /** 1-based number in the official order, drawn as a pin and in the table. */
  readonly index: number;
  /** Pin anchor in percent of the crop. */
  readonly left: number;
  readonly top: number;
  /** Colour tone 0-6 of the sale price among the 73 barrios. */
  readonly tone: number;
}
export interface BarrioMapModel {
  /** SVG viewBox cropped to the district. */
  readonly viewBox: string;
  readonly width: number;
  readonly height: number;
  readonly barrios: readonly BarrioMapItem[];
  /** Lowest and highest sale price of the 73 barrios (legend). */
  readonly range: { readonly min: number; readonly max: number };
}

/** Barrio map of one district (reference `zd4-bm`): crop to its barrios, tones from all 73 barrios. */
export function buildBarrioMap(
  market: MarketData,
  shapes: { readonly barrios: Readonly<Record<string, string>> },
  districtSlug: string,
): BarrioMapModel {
  const sales = market.barrios.map((barrio) => barrio.sale);
  const inDistrict = market.barrios.filter((barrio) => barrio.district === districtSlug);
  const shaped = inDistrict.flatMap((barrio, index) => {
    const d = shapes.barrios[barrio.slug];
    return d === undefined ? [] : [{ barrio, d, index: index + 1 }];
  });
  const boxes = shaped.map(({ d }) => pathBounds(d));
  const pad = 6;
  const x0 = Math.min(...boxes.map((box) => box.x0)) - pad;
  const y0 = Math.min(...boxes.map((box) => box.y0)) - pad;
  const width = Math.max(...boxes.map((box) => box.x1)) + pad - x0;
  const height = Math.max(...boxes.map((box) => box.y1)) + pad - y0;
  return {
    viewBox: `${x0.toFixed(1)} ${y0.toFixed(1)} ${width.toFixed(1)} ${height.toFixed(1)}`,
    width,
    height,
    barrios: shaped.map(({ barrio, d, index }) => {
      const centre = pathCentroid(d);
      return {
        slug: barrio.slug,
        name: barrio.name,
        d,
        index,
        left: ((centre.x - x0) / width) * 100,
        top: ((centre.y - y0) / height) * 100,
        tone: toneOf(sales, barrio.sale, TONES),
      };
    }),
    range: { min: Math.min(...sales), max: Math.max(...sales) },
  };
}
