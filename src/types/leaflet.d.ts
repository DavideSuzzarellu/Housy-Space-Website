// Minimal typings for the Leaflet 1.9 API used by the property and catalog maps (leaflet ships
// no types and only `leaflet` is an approved dependency, AGENTS.md §2). Extend here when using
// more of it.
declare module "leaflet" {
  export type LatLngTuple = readonly [number, number];

  export interface LatLng {
    readonly lat: number;
    readonly lng: number;
  }

  export interface Point {
    readonly x: number;
    readonly y: number;
  }

  export interface LatLngBounds {
    pad(bufferRatio: number): LatLngBounds;
    getSouth(): number;
    getWest(): number;
    getNorth(): number;
    getEast(): number;
  }

  export interface MapOptions {
    readonly maxZoom?: number;
    readonly scrollWheelZoom?: boolean;
    readonly attributionControl?: boolean;
    readonly zoomControl?: boolean;
  }

  export interface ZoomPanOptions {
    readonly animate?: boolean;
  }

  export interface FitBoundsOptions extends ZoomPanOptions {
    readonly maxZoom?: number;
  }

  export interface AttributionControl {
    setPrefix(prefix: string | false): this;
  }

  export interface Map {
    readonly attributionControl: AttributionControl;
    setView(center: LatLngTuple, zoom: number, options?: ZoomPanOptions): this;
    fitBounds(bounds: LatLngBounds, options?: FitBoundsOptions): this;
    getZoom(): number;
    getBounds(): LatLngBounds;
    project(latlng: LatLngTuple, zoom?: number): Point;
    unproject(point: Point, zoom?: number): LatLng;
    invalidateSize(): this;
    on(type: "zoomend" | "moveend", listener: () => void): this;
    remove(): this;
  }

  export interface Layer {
    addTo(map: Map): this;
  }

  export interface LayerGroup extends Layer {
    addLayer(layer: Layer): this;
    clearLayers(): this;
  }

  export interface TileLayerOptions {
    readonly attribution?: string;
    readonly maxZoom?: number;
    readonly minZoom?: number;
  }

  export interface PathOptions {
    readonly className?: string;
    readonly interactive?: boolean;
  }

  export interface CircleOptions extends PathOptions {
    readonly radius: number;
  }

  // Opaque: only created by `divIcon` and passed to `marker`.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface Icon {}

  export interface DivIconOptions {
    readonly className?: string;
    readonly html?: string | HTMLElement;
    readonly iconSize?: readonly [number, number];
  }

  export interface MarkerOptions {
    readonly icon?: Icon;
    readonly title?: string;
    readonly alt?: string;
    readonly keyboard?: boolean;
    readonly riseOnHover?: boolean;
  }

  export interface PopupOptions {
    readonly maxWidth?: number;
  }

  export interface Marker extends Layer {
    bindPopup(content: HTMLElement | string, options?: PopupOptions): this;
    on(type: "click", listener: () => void): this;
  }

  export function map(element: HTMLElement, options?: MapOptions): Map;
  export function tileLayer(urlTemplate: string, options?: TileLayerOptions): Layer;
  export function circle(center: LatLngTuple, options: CircleOptions): Layer;
  export function layerGroup(): LayerGroup;
  export function marker(latlng: LatLngTuple | LatLng, options?: MarkerOptions): Marker;
  export function divIcon(options: DivIconOptions): Icon;
  export function latLngBounds(latlngs: readonly LatLngTuple[]): LatLngBounds;
  export function point(x: number, y: number): Point;
}
