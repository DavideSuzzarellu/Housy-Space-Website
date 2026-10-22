import type { PropertyLocation } from "../domain/property";

/**
 * Smallest circle drawn for a listing (≈1 km across, several Eixample blocks), so the area
 * never narrows down the building, whatever radius Mobilia sends (AGENTS.md §5).
 */
export const MIN_AREA_RADIUS_M = 500;

/** Street level at most: closer zooms add nothing to an approximate area. */
export const MAX_ZOOM = 16;

export interface MapView {
  readonly center: readonly [number, number];
  readonly radiusM: number;
  readonly zoom: number;
}

/** Widest zoom first: the first step whose radius limit fits wins. */
const ZOOM_STEPS = [
  { maxRadiusM: 1000, zoom: 14 },
  { maxRadiusM: 2500, zoom: 13 },
] as const;
const WIDE_ZOOM = 12;

/** Privacy (§5): always an area around the zone centre, never a pin. */
export function getMapView(
  location: Pick<PropertyLocation, "latitude" | "longitude" | "radiusM">,
): MapView {
  const radiusM = Math.max(location.radiusM, MIN_AREA_RADIUS_M);
  const zoom = ZOOM_STEPS.find((step) => radiusM <= step.maxRadiusM)?.zoom ?? WIDE_ZOOM;
  return { center: [location.latitude, location.longitude], radiusM, zoom };
}

/** ICGC WMTS colour base map (AGENTS.md §2) and its required CC BY attribution. */
export const ICGC_TILES_URL =
  "https://geoserveis.icgc.cat/servei/catalunya/mapa-base/wmts/estandard/MON3857NW/{z}/{x}/{y}.png";
export const ICGC_ATTRIBUTION =
  '© <a href="https://www.icgc.cat/" target="_blank" rel="noopener noreferrer">ICGC</a> (CC BY 4.0)';
