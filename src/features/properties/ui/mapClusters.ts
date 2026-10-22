/**
 * Greedy screen-space clustering for the catalog map (replaces Leaflet.markercluster: no global
 * `L`, no extra bundle). Points are visited in id order so the result never depends on input
 * order; a point joins the first cluster whose centroid is within `radiusPx`.
 */

export interface ScreenPoint {
  readonly id: string;
  readonly x: number;
  readonly y: number;
}

export interface Cluster {
  readonly ids: readonly string[];
  /** Centroid of the member points. */
  readonly x: number;
  readonly y: number;
}

interface MutableCluster {
  ids: string[];
  sumX: number;
  sumY: number;
}

export function clusterPoints(points: readonly ScreenPoint[], radiusPx: number): Cluster[] {
  const clusters: MutableCluster[] = [];
  const ordered = [...points].sort((a, b) => a.id.localeCompare(b.id));
  for (const point of ordered) {
    const target = clusters.find((cluster) => {
      const count = cluster.ids.length;
      return Math.hypot(cluster.sumX / count - point.x, cluster.sumY / count - point.y) <= radiusPx;
    });
    if (target === undefined) {
      clusters.push({ ids: [point.id], sumX: point.x, sumY: point.y });
    } else {
      target.ids.push(point.id);
      target.sumX += point.x;
      target.sumY += point.y;
    }
  }
  return clusters.map(({ ids, sumX, sumY }) => ({
    ids,
    x: sumX / ids.length,
    y: sumY / ids.length,
  }));
}
