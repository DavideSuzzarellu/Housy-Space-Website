import { ICGC_TILES_URL, type MapView } from "./mapView";

/** Web Mercator tile edge in CSS pixels (ICGC WMTS MON3857NW, same grid as Leaflet). */
export const TILE_SIZE = 256;

const EARTH_CIRCUMFERENCE_M = 2 * Math.PI * 6378137;

export interface StaticMapTile {
  readonly url: string;
  /** Offset of the tile's top-left corner from the frame's top-left corner, in CSS pixels. */
  readonly left: number;
  readonly top: number;
}

export interface StaticMap {
  readonly width: number;
  readonly height: number;
  readonly tiles: readonly StaticMapTile[];
  /** The approximate zone (§5): always centred, never a pin. */
  readonly circle: { readonly cx: number; readonly cy: number; readonly r: number };
}

const round = (value: number): number => Math.round(value * 100) / 100;

function tileUrl(z: number, x: number, y: number): string {
  return ICGC_TILES_URL.replace("{z}", String(z))
    .replace("{x}", String(x))
    .replace("{y}", String(y));
}

/**
 * Script-free map for print (property sheet PDF): the ICGC colour tiles covering a frame
 * centred on the zone, plus the zone circle in frame pixels. Same view as the interactive
 * maps (`getMapView`), so the minimum radius and maximum zoom rules apply here too.
 */
export function buildStaticMap(
  view: MapView,
  size: { readonly width: number; readonly height: number },
): StaticMap {
  const [latitude, longitude] = view.center;
  const scale = TILE_SIZE * 2 ** view.zoom;
  const latRad = (latitude * Math.PI) / 180;
  const centreX = ((longitude + 180) / 360) * scale;
  const centreY = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * scale;
  const originX = centreX - size.width / 2;
  const originY = centreY - size.height / 2;

  const tiles: StaticMapTile[] = [];
  const lastTile = 2 ** view.zoom - 1;
  const firstRow = Math.max(0, Math.floor(originY / TILE_SIZE));
  const lastRow = Math.min(lastTile, Math.floor((originY + size.height - 1) / TILE_SIZE));
  const firstColumn = Math.floor(originX / TILE_SIZE);
  const lastColumn = Math.floor((originX + size.width - 1) / TILE_SIZE);
  for (let y = firstRow; y <= lastRow; y += 1) {
    for (let x = firstColumn; x <= lastColumn; x += 1) {
      tiles.push({
        url: tileUrl(view.zoom, x, y),
        left: round(x * TILE_SIZE - originX),
        top: round(y * TILE_SIZE - originY),
      });
    }
  }

  const metresPerPixel = (EARTH_CIRCUMFERENCE_M * Math.cos(latRad)) / scale;
  return {
    width: size.width,
    height: size.height,
    tiles,
    circle: { cx: size.width / 2, cy: size.height / 2, r: round(view.radiusM / metresPerPixel) },
  };
}
