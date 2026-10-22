import type * as Leaflet from "leaflet";
import type { CatalogEntry } from "../application/catalog";
import type { MapBounds } from "../domain/catalog";
import { formatMessage } from "@/shared/lib/format";
import { loadLeaflet } from "./leaflet.client";
import { clusterPoints } from "./mapClusters";
import { ICGC_ATTRIBUTION, ICGC_TILES_URL, MAX_ZOOM, MIN_AREA_RADIUS_M } from "./mapView";

/**
 * Catalog map (vanilla Leaflet, loaded on demand by `catalog.client.ts`). Privacy (§5): every
 * listing is drawn as its approximate zone, a circle of at least MIN_AREA_RADIUS_M, with a
 * hollow marker at the zone centre only to open the popup and reach it by keyboard.
 * Nearby listings are grouped with `clusterPoints` and re-grouped on every zoom; listings
 * that still overlap at the closest zoom share one marker whose popup lists them all.
 * Popups are built with DOM nodes (textContent), never HTML strings from the CRM.
 */

export interface CatalogMapLabels {
  /** "{count} properties: zoom in" */
  readonly cluster: string;
  /** Appended to every marker name: "(approximate location)". */
  readonly approximate: string;
}

export interface CatalogMapOptions {
  readonly labels: CatalogMapLabels;
  /** Called when the user pans or zooms (not when the map fits itself). */
  readonly onUserMove: () => void;
}

export interface CatalogMapController {
  /** Shows these entries; `fit` frames them, otherwise the current view is kept. */
  show(entries: readonly CatalogEntry[], options: { readonly fit: boolean }): void;
  /** Call after the map container becomes visible or changes size. */
  refresh(): void;
  getBounds(): MapBounds;
  destroy(): void;
}

type LocatedEntry = CatalogEntry & { readonly location: NonNullable<CatalogEntry["location"]> };

const BARCELONA: Leaflet.LatLngTuple = [41.395, 2.165];
const DEFAULT_ZOOM = 12;
const MAX_FIT_ZOOM = 14;
/** From this zoom on, only listings that really overlap are grouped. */
const NO_CLUSTER_ZOOM = MAX_ZOOM - 1;
const CLUSTER_RADIUS_PX = 44;
const OVERLAP_RADIUS_PX = 12;
/** Moves within this window after a programmatic fit are not the user's. */
const PROGRAMMATIC_MOVE_MS = 400;

function isLocated(entry: CatalogEntry): entry is LocatedEntry {
  return entry.location !== undefined;
}

function popupItem(entry: CatalogEntry): HTMLElement {
  const item = document.createElement("div");
  item.className = "catalog-popup";
  const link = document.createElement("a");
  link.href = entry.href;
  link.textContent = entry.title;
  const price = document.createElement("p");
  price.textContent = entry.priceLabel;
  item.append(link, price);
  return item;
}

function popupContent(entries: readonly CatalogEntry[]): HTMLElement {
  const [only] = entries;
  if (entries.length === 1 && only !== undefined) return popupItem(only);
  const list = document.createElement("ul");
  list.className = "catalog-popup-list";
  for (const entry of entries) {
    const item = document.createElement("li");
    item.append(popupItem(entry));
    list.append(item);
  }
  return list;
}

export async function mountCatalogMap(
  element: HTMLElement,
  { labels, onUserMove }: CatalogMapOptions,
): Promise<CatalogMapController> {
  const L: typeof Leaflet = await loadLeaflet();
  element.replaceChildren(); // drop the loading placeholder

  const map = L.map(element, { scrollWheelZoom: false, maxZoom: MAX_ZOOM }).setView(
    BARCELONA,
    DEFAULT_ZOOM,
  );
  map.attributionControl.setPrefix(false);
  L.tileLayer(ICGC_TILES_URL, { attribution: ICGC_ATTRIBUTION, maxZoom: MAX_ZOOM }).addTo(map);
  const areas = L.layerGroup().addTo(map);
  const markers = L.layerGroup().addTo(map);
  let current: LocatedEntry[] = [];
  let programmaticUntil = 0;

  const latLng = (entry: LocatedEntry): Leaflet.LatLngTuple => [
    entry.location.latitude,
    entry.location.longitude,
  ];

  function area(entry: LocatedEntry): Leaflet.Layer {
    return L.circle(latLng(entry), {
      radius: Math.max(entry.location.radiusM, MIN_AREA_RADIUS_M),
      className: "property-map-area",
      interactive: false,
    });
  }

  /** One listing, or several sharing a zone at the closest zoom: opens a popup. */
  function zoneMarker(members: readonly LocatedEntry[], center: Leaflet.LatLng): Leaflet.Marker {
    const [only] = members;
    const name =
      members.length === 1 && only !== undefined
        ? `${only.title} ${labels.approximate}`
        : formatMessage(labels.cluster, { count: members.length });
    const icon =
      members.length === 1
        ? L.divIcon({ className: "catalog-pin", iconSize: [18, 18] })
        : countIcon(members.length);
    return L.marker(center, {
      icon,
      title: name,
      alt: name,
      keyboard: true,
      riseOnHover: true,
    }).bindPopup(popupContent(members), { maxWidth: 260 });
  }

  function countIcon(count: number): Leaflet.Icon {
    const label = document.createElement("span");
    label.textContent = String(count);
    return L.divIcon({ className: "catalog-cluster", html: label, iconSize: [40, 40] });
  }

  /** Far away: a count that zooms in on its members. */
  function clusterMarker(members: readonly LocatedEntry[], center: Leaflet.LatLng): Leaflet.Marker {
    const label = formatMessage(labels.cluster, { count: members.length });
    return L.marker(center, {
      icon: countIcon(members.length),
      title: label,
      alt: label,
      keyboard: true,
    }).on("click", () => {
      map.fitBounds(L.latLngBounds(members.map(latLng)).pad(0.4), { maxZoom: NO_CLUSTER_ZOOM });
    });
  }

  function render(): void {
    areas.clearLayers();
    markers.clearLayers();
    const zoom = map.getZoom();
    const close = zoom >= NO_CLUSTER_ZOOM;
    const byRef = new Map(current.map((entry) => [String(entry.ref), entry]));
    const points = current.map((entry) => {
      const point = map.project(latLng(entry), zoom);
      return { id: String(entry.ref), x: point.x, y: point.y };
    });
    const radius = close ? OVERLAP_RADIUS_PX : CLUSTER_RADIUS_PX;
    for (const cluster of clusterPoints(points, radius)) {
      const members = cluster.ids
        .map((id) => byRef.get(id))
        .filter((entry): entry is LocatedEntry => entry !== undefined);
      const center = map.unproject(L.point(cluster.x, cluster.y), zoom);
      if (members.length === 1 || close) {
        members.forEach((entry) => areas.addLayer(area(entry)));
        markers.addLayer(zoneMarker(members, center));
      } else if (members.length > 1) {
        markers.addLayer(clusterMarker(members, center));
      }
    }
  }

  function fit(): void {
    programmaticUntil = performance.now() + PROGRAMMATIC_MOVE_MS;
    if (current.length === 0) {
      map.setView(BARCELONA, DEFAULT_ZOOM, { animate: false });
    } else {
      map.fitBounds(L.latLngBounds(current.map(latLng)).pad(0.3), {
        maxZoom: MAX_FIT_ZOOM,
        animate: false,
      });
    }
  }

  map.on("zoomend", render);
  map.on("moveend", () => {
    if (performance.now() > programmaticUntil) onUserMove();
  });

  return {
    show(entries, { fit: shouldFit }) {
      current = entries.filter(isLocated);
      if (shouldFit) fit();
      render();
    },
    refresh() {
      map.invalidateSize();
    },
    getBounds() {
      const bounds = map.getBounds();
      return {
        south: bounds.getSouth(),
        west: bounds.getWest(),
        north: bounds.getNorth(),
        east: bounds.getEast(),
      };
    },
    destroy() {
      map.remove();
    },
  };
}
