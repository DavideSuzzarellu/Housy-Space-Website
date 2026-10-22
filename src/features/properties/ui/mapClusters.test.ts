import { describe, expect, it } from "vitest";
import { clusterPoints } from "./mapClusters";

describe("clusterPoints", () => {
  it("keeps distant points apart", () => {
    const clusters = clusterPoints(
      [
        { id: "a", x: 0, y: 0 },
        { id: "b", x: 200, y: 0 },
      ],
      40,
    );
    expect(clusters.map((cluster) => cluster.ids)).toEqual([["a"], ["b"]]);
  });

  it("groups points within the radius around their centroid", () => {
    const clusters = clusterPoints(
      [
        { id: "a", x: 0, y: 0 },
        { id: "b", x: 20, y: 0 },
        { id: "c", x: 10, y: 30 },
        { id: "d", x: 300, y: 300 },
      ],
      40,
    );
    expect(clusters).toEqual([
      { ids: ["a", "b", "c"], x: 10, y: 10 },
      { ids: ["d"], x: 300, y: 300 },
    ]);
  });

  it("is deterministic regardless of input order", () => {
    const points = [
      { id: "b", x: 20, y: 0 },
      { id: "a", x: 0, y: 0 },
    ];
    expect(clusterPoints(points, 40)).toEqual(clusterPoints([...points].reverse(), 40));
  });

  it("returns nothing for no points", () => {
    expect(clusterPoints([], 40)).toEqual([]);
  });
});
