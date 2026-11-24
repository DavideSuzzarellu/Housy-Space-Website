/**
 * Geometry of the "Cerdà grid" drawn behind the home presentation: chamfered city blocks on a
 * 120-unit pitch, some with an inner courtyard, plus accent routes ending in a target block.
 * Generated from this small spec instead of pasting ~100 hand-written paths.
 */

const ORIGIN = 10;
const PITCH = 120;
const BLOCK = 100;
const CHAMFER = 15;
const COURTYARD_INSET = 26;
const COURTYARD_SIZE = 48;
const COURTYARD_CHAMFER = 8;
/** The courtyard is drawn this many seconds after its block. */
const COURTYARD_LAG = 0.5;

export interface GridCell {
  /** Seconds before the block starts drawing. */
  delay: number;
  courtyard: boolean;
}

export interface GridShape {
  kind: "block" | "courtyard";
  d: string;
  delay: number;
}

export interface GridRoute {
  d: string;
  delay: number;
  duration: number;
}

export interface GridTarget {
  col: number;
  row: number;
  delay: number;
  dot: { cx: number; cy: number; delay: number };
}

export interface GridSpec {
  viewBox: string;
  /** One string per row; cells are delays in seconds, a trailing `*` adds a courtyard. */
  rows: readonly string[];
  routes: readonly GridRoute[];
  targets: readonly GridTarget[];
}

/** Parses `"1.16* 0.9"` rows into cells. Throws on a malformed delay (spec is static data). */
export function parseRows(rows: readonly string[]): GridCell[][] {
  return rows.map((row) =>
    row.split(/\s+/).map((token) => {
      const delay = Number.parseFloat(token);
      if (Number.isNaN(delay)) throw new Error(`Invalid street grid cell: "${token}"`);
      return { delay, courtyard: token.endsWith("*") };
    }),
  );
}

/** Chamfered square with its top-left corner at (x, y). */
export function chamferedSquare(x: number, y: number, size: number, chamfer: number): string {
  const r = x + size;
  const b = y + size;
  return `M${x + chamfer} ${y}H${r - chamfer}L${r} ${y + chamfer}V${b - chamfer}L${r - chamfer} ${b}H${x + chamfer}L${x} ${b - chamfer}V${y + chamfer}Z`;
}

export function blockPath(col: number, row: number): string {
  return chamferedSquare(ORIGIN + col * PITCH, ORIGIN + row * PITCH, BLOCK, CHAMFER);
}

/** Every block and courtyard of the grid, in drawing order. */
export function gridShapes(rows: readonly string[]): GridShape[] {
  const shapes: GridShape[] = [];
  parseRows(rows).forEach((cells, row) => {
    cells.forEach(({ delay, courtyard }, col) => {
      shapes.push({ kind: "block", d: blockPath(col, row), delay });
      if (courtyard) {
        const x = ORIGIN + col * PITCH + COURTYARD_INSET;
        const y = ORIGIN + row * PITCH + COURTYARD_INSET;
        shapes.push({
          kind: "courtyard",
          d: chamferedSquare(x, y, COURTYARD_SIZE, COURTYARD_CHAMFER),
          delay: Math.round((delay + COURTYARD_LAG) * 100) / 100,
        });
      }
    });
  });
  return shapes;
}

export const DESKTOP_GRID: GridSpec = {
  viewBox: "0 0 1320 720",
  rows: [
    "1.16* 1.04* 0.88 0.69 0.6 0.57* 0.65 0.7* 0.89 1.04 1.24*",
    "1.16* 0.9* 0.75 0.58 0.51 0.44* 0.44* 0.64 0.75 0.94* 1.15",
    "1.05 0.9* 0.76 0.51 0.32 0.28* 0.36* 0.56 0.73 0.88 1.09",
    "1.08 0.95 0.74* 0.56 0.42 0.23 0.39* 0.53* 0.67* 0.93* 1.04*",
    "1.11 0.89 0.78 0.66 0.46 0.42 0.55* 0.58* 0.74 0.95* 1.06",
    "1.17 1.08 0.88 0.77* 0.7 0.66 0.64 0.7 0.82* 0.99* 1.17*",
  ],
  routes: [
    {
      d: "M-10 600H108L120 588V492L132 480H228L240 468V360L222.5 342.5",
      delay: 2.2,
      duration: 2.4,
    },
    { d: "M1080 -10V108L1092 120H1188L1200 132V360L1182.5 377.5", delay: 2.8, duration: 2.4 },
  ],
  targets: [
    { col: 1, row: 2, delay: 4.55, dot: { cx: 222.5, cy: 342.5, delay: 4.7 } },
    { col: 9, row: 3, delay: 5.15, dot: { cx: 1182.5, cy: 377.5, delay: 5.3 } },
  ],
};

export const MOBILE_GRID: GridSpec = {
  viewBox: "-44 0 600 960",
  rows: [
    "1.15 1.1 1.08 1.06 1.29",
    "0.97* 0.81* 0.81 0.82* 1.01",
    "0.75* 0.61* 0.57* 0.61 0.84*",
    "0.65 0.34 0.32 0.49 0.8",
    "0.64* 0.35* 0.27* 0.51 0.71",
    "0.7* 0.61 0.53 0.7* 0.93*",
    "0.95 0.76 0.78 0.82* 0.98*",
    "1.19* 1.09 1.11 1.1 1.26*",
  ],
  routes: [{ d: "M-60 960H108L120 948V852L132 840H360L377.5 822.5", delay: 2, duration: 2.6 }],
  targets: [{ col: 3, row: 6, delay: 4.6, dot: { cx: 377.5, cy: 822.5, delay: 4.75 } }],
};
