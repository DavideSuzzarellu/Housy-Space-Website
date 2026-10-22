import type { Map as LeafletMap } from "leaflet";
import { loadLeaflet } from "./leaflet.client";
import { getMapView, ICGC_ATTRIBUTION, ICGC_TILES_URL, MAX_ZOOM, type MapView } from "./mapView";

/**
 * Property map island (vanilla, AGENTS.md §2): Leaflet (JS and CSS) is downloaded only when
 * the map scrolls into view, so neither blocks the first render of the detail page. Re-initialised on every `astro:page-load` and torn down on
 * `astro:before-swap` so client-side navigation never leaks map instances (§3.3).
 */

const SELECTOR = "[data-property-map]";
const mounted = new Map<HTMLElement, LeafletMap>();
let observer: IntersectionObserver | undefined;

function readView(element: HTMLElement): MapView | undefined {
  const { lat, lng, radius } = element.dataset;
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return undefined;
  const radiusM = Number(radius);
  return getMapView({ latitude, longitude, radiusM: Number.isFinite(radiusM) ? radiusM : 0 });
}

async function mount(element: HTMLElement): Promise<void> {
  const view = readView(element);
  if (view === undefined || mounted.has(element)) return;
  const L = await loadLeaflet();
  if (!element.isConnected || mounted.has(element)) return;
  element.replaceChildren(); // drop the loading placeholder

  const map = L.map(element, { scrollWheelZoom: false, maxZoom: MAX_ZOOM }).setView(
    view.center,
    view.zoom,
  );
  map.attributionControl.setPrefix(false);
  L.tileLayer(ICGC_TILES_URL, { attribution: ICGC_ATTRIBUTION, maxZoom: MAX_ZOOM }).addTo(map);
  L.circle(view.center, {
    radius: view.radiusM,
    className: "property-map-area",
    interactive: false,
  }).addTo(map);
  mounted.set(element, map);
  element.dataset["mapReady"] = "true";
}

function teardown(): void {
  observer?.disconnect();
  observer = undefined;
  for (const map of mounted.values()) map.remove();
  mounted.clear();
}

document.addEventListener("astro:page-load", () => {
  const elements = [...document.querySelectorAll<HTMLElement>(SELECTOR)];
  if (elements.length === 0) return;
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting || !(entry.target instanceof HTMLElement)) continue;
        io.unobserve(entry.target);
        void mount(entry.target);
      }
    },
    { rootMargin: "200px 0px" },
  );
  observer = io;
  elements.forEach((element) => io.observe(element));
});

document.addEventListener("astro:before-swap", teardown);
