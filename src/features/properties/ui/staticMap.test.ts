import { describe, expect, it } from "vitest";
import { getMapView, ICGC_TILES_URL, MIN_AREA_RADIUS_M } from "./mapView";
import { buildStaticMap, TILE_SIZE } from "./staticMap";

const SIZE = { width: 680, height: 360 } as const;
const zone = { latitude: 41.4, longitude: 2.17, radiusM: 120 };

describe("buildStaticMap", () => {
  const map = buildStaticMap(getMapView(zone), SIZE);

  it("draws the approximate zone as a circle centred in the frame, never smaller than the minimum", () => {
    expect(map.circle.cx).toBe(SIZE.width / 2);
    expect(map.circle.cy).toBe(SIZE.height / 2);
    // 500 m at latitude 41.4° and zoom 14 ≈ 7.167 m per pixel.
    expect(MIN_AREA_RADIUS_M).toBe(500);
    expect(map.circle.r).toBeCloseTo(69.76, 1);
  });

  it("uses the ICGC colour tiles at the zoom chosen by getMapView", () => {
    expect(map.tiles.length).toBeGreaterThan(0);
    for (const tile of map.tiles) {
      expect(tile.url).toMatch(
        /^https:\/\/geoserveis\.icgc\.cat\/servei\/catalunya\/mapa-base\/wmts\/estandard\/MON3857NW\/14\/\d+\/\d+\.png$/,
      );
    }
    expect(ICGC_TILES_URL).toContain("/estandard/");
  });

  it("covers the whole frame with tiles and nothing more than one tile outside it", () => {
    const lefts = map.tiles.map((tile) => tile.left);
    const tops = map.tiles.map((tile) => tile.top);
    expect(Math.min(...lefts)).toBeLessThanOrEqual(0);
    expect(Math.min(...lefts)).toBeGreaterThan(-TILE_SIZE);
    expect(Math.min(...tops)).toBeLessThanOrEqual(0);
    expect(Math.min(...tops)).toBeGreaterThan(-TILE_SIZE);
    expect(Math.max(...lefts) + TILE_SIZE).toBeGreaterThanOrEqual(SIZE.width);
    expect(Math.max(...lefts)).toBeLessThan(SIZE.width);
    expect(Math.max(...tops) + TILE_SIZE).toBeGreaterThanOrEqual(SIZE.height);
    expect(Math.max(...tops)).toBeLessThan(SIZE.height);
  });

  it("lays tiles on a regular grid without gaps or duplicates", () => {
    const urls = map.tiles.map((tile) => tile.url);
    expect(new Set(urls).size).toBe(urls.length);
    const columns = new Set(map.tiles.map((tile) => tile.left)).size;
    const rows = new Set(map.tiles.map((tile) => tile.top)).size;
    expect(map.tiles).toHaveLength(columns * rows);
  });

  it("places the zone centre at the frame centre (the tile under it holds that point)", () => {
    // World pixel of the zone centre at zoom 14, computed independently (Web Mercator).
    const scale = TILE_SIZE * 2 ** 14;
    const worldX = ((zone.longitude + 180) / 360) * scale;
    const tileX = Math.floor(worldX / TILE_SIZE);
    const centreTile = map.tiles.find((tile) => tile.url.includes(`/14/${tileX}/`));
    expect(centreTile).toBeDefined();
    const offsetInTile = worldX - tileX * TILE_SIZE;
    expect((centreTile?.left ?? Number.NaN) + offsetInTile).toBeCloseTo(SIZE.width / 2, 1);
  });
});
