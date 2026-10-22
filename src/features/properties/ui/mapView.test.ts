import { describe, expect, it } from "vitest";
import { getMapView, MIN_AREA_RADIUS_M } from "./mapView";

describe("getMapView", () => {
  it("always shows an area (circle) around the zone centre, never a pin", () => {
    expect(getMapView({ latitude: 41.41, longitude: 2.19, radiusM: 800 })).toEqual({
      center: [41.41, 2.19],
      radiusM: 800,
      zoom: 14,
    });
  });

  it("enforces a wide minimum radius so the area never narrows down the building", () => {
    expect(MIN_AREA_RADIUS_M).toBeGreaterThanOrEqual(500);
    expect(getMapView({ latitude: 41.4, longitude: 2.1, radiusM: 0 })).toMatchObject({
      radiusM: MIN_AREA_RADIUS_M,
    });
    expect(getMapView({ latitude: 41.4, longitude: 2.1, radiusM: 250 }).radiusM).toBe(
      MIN_AREA_RADIUS_M,
    );
  });

  it("zooms out for larger zones so the whole circle stays in view", () => {
    expect(getMapView({ latitude: 41.4, longitude: 2.1, radiusM: 1500 }).zoom).toBe(13);
    expect(getMapView({ latitude: 41.4, longitude: 2.1, radiusM: 4000 }).zoom).toBe(12);
  });
});
