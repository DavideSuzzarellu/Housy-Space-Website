import type * as Leaflet from "leaflet";
// `?url`: emitted as a hashed asset instead of being bundled into the page's render-blocking CSS.
import leafletCssUrl from "leaflet/dist/leaflet.css?url";

/**
 * On-demand Leaflet (JS + CSS) shared by the property and catalog maps: nothing is downloaded
 * until a map is about to be shown (AGENTS.md §8 performance).
 */

/**
 * Adds Leaflet's stylesheet on demand. Checked on every mount: ClientRouter drops head elements
 * that the next page does not declare, and the browser cache makes re-adding it free.
 */
function loadLeafletCss(): Promise<void> {
  if (document.querySelector("link[data-leaflet-css]") !== null) return Promise.resolve();
  return new Promise((resolve) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = leafletCssUrl;
    link.dataset["leafletCss"] = "";
    link.addEventListener("load", () => resolve(), { once: true });
    link.addEventListener("error", () => resolve(), { once: true });
    document.head.append(link);
  });
}

export async function loadLeaflet(): Promise<typeof Leaflet> {
  const [L] = await Promise.all([import("leaflet"), loadLeafletCss()]);
  return L;
}
