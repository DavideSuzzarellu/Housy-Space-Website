import { withUrlExtras } from "@/shared/i18n/routes";
import { formatMessage } from "@/shared/lib/format";
import type { CatalogEntry } from "../application/catalog";
import { catalogEntriesSchema } from "../application/catalogEntrySchema";
import {
  CATALOG_PARAMS,
  CATALOG_VIEWS,
  DEFAULT_CATALOG_QUERY,
  parseCatalogQuery,
  serializeCatalogQuery,
  SORT_PARAM_VALUES,
  type CatalogQuery,
  type CatalogView,
} from "../application/catalogQuery";
import { filterCatalog, type MapBounds } from "../domain/catalog";
import type { CatalogMapController } from "./catalogMap.client";

/**
 * Catalog filter island (vanilla, AGENTS.md §2). The page already lists every card; this
 * script hides/reorders them from the URL query, keeps the URL in sync (shareable searches,
 * `history.replaceState` keeps the ClientRouter state) and loads the map only for map views.
 * Bound on every `astro:page-load` and torn down on `astro:before-swap` (§3.3).
 */

let teardown: (() => void) | undefined;

function readPayload(root: HTMLElement): CatalogEntry[] | undefined {
  const text = root.querySelector("script[data-catalog-entries]")?.textContent;
  if (text === undefined || text === null || text === "") return undefined;
  try {
    const result = catalogEntriesSchema.safeParse(JSON.parse(text));
    return result.success ? result.data : undefined;
  } catch {
    return undefined;
  }
}

function formParams(form: HTMLFormElement): URLSearchParams {
  const params = new URLSearchParams();
  for (const [name, value] of new FormData(form)) {
    if (typeof value === "string" && value !== "") params.append(name, value);
  }
  return params;
}

function setControls(form: HTMLFormElement, query: CatalogQuery): void {
  const params = serializeCatalogQuery(query);
  for (const element of form.elements) {
    if (element instanceof HTMLInputElement && element.type === "checkbox") {
      element.checked = query.filters.features.some((feature) => feature === element.value);
    } else if (element instanceof HTMLInputElement || element instanceof HTMLSelectElement) {
      const { name } = element;
      // The sort select shows its default value instead of an empty one.
      const fallback = name === CATALOG_PARAMS.sort ? SORT_PARAM_VALUES.recent : "";
      element.value = params.get(name) ?? fallback;
    }
  }
}

function isView(value: string | undefined): value is CatalogView {
  return CATALOG_VIEWS.some((view) => view === value);
}

function init(root: HTMLElement): (() => void) | undefined {
  const entries = readPayload(root);
  const form = root.querySelector<HTMLFormElement>("form[data-catalog-form]");
  const list = root.querySelector<HTMLElement>("[data-catalog-list]");
  const count = root.querySelector<HTMLElement>("[data-catalog-count]");
  const empty = root.querySelector<HTMLElement>("[data-catalog-empty]");
  const mapElement = root.querySelector<HTMLElement>("[data-catalog-map]");
  const searchArea = root.querySelector<HTMLElement>("[data-catalog-search-area]");
  const areaChip = root.querySelector<HTMLElement>("[data-catalog-clear-area]");
  // Anything missing (e.g. a payload that fails validation): keep the server-rendered list.
  if (entries === undefined || form === null || count === null) return undefined;

  const items = new Map<string, HTMLElement>();
  root.querySelectorAll<HTMLElement>("[data-catalog-ref]").forEach((item) => {
    const ref = item.dataset["catalogRef"];
    if (ref !== undefined) items.set(ref, item);
  });
  const viewButtons = [...root.querySelectorAll<HTMLButtonElement>("[data-catalog-view]")];
  const { countOne = "", countOther = "", clusterLabel = "", approximateLabel = "" } = root.dataset;

  let query = parseCatalogQuery(new URLSearchParams(location.search));
  let map: Promise<CatalogMapController> | undefined;
  let visible: CatalogEntry[] = entries;
  let disposed = false;

  function ensureMap(): Promise<CatalogMapController> | undefined {
    if (mapElement === null) return undefined;
    map ??= import("./catalogMap.client").then((module) =>
      module.mountCatalogMap(mapElement, {
        labels: { cluster: clusterLabel, approximate: approximateLabel },
        onUserMove: () => {
          if (searchArea !== null) searchArea.hidden = false;
        },
      }),
    );
    return map;
  }

  function updateMap(refresh: boolean): void {
    if (query.view === "list") return;
    void ensureMap()?.then((controller) => {
      if (disposed) return;
      if (refresh) controller.refresh();
      // A map-area search keeps the user's view; any other search frames the results.
      controller.show(visible, { fit: query.filters.bounds === undefined });
    });
  }

  // Arrow (not a hoisted declaration) so the null checks above still narrow inside it.
  const render = (options: { readonly refreshMap?: boolean } = {}): void => {
    visible = filterCatalog(entries, query.filters);
    const shown = new Set(visible.map((entry) => String(entry.ref)));
    for (const [ref, item] of items) item.hidden = !shown.has(ref);
    for (const entry of visible) {
      const item = items.get(String(entry.ref));
      if (item !== undefined) list?.append(item);
    }
    count.textContent =
      visible.length === 1 ? countOne : formatMessage(countOther, { count: visible.length });
    if (empty !== null) empty.hidden = visible.length > 0 || items.size === 0;
    if (areaChip !== null) areaChip.hidden = query.filters.bounds === undefined;
    if (searchArea !== null) searchArea.hidden = true;

    root.dataset["view"] = query.view;
    for (const button of viewButtons) {
      button.setAttribute("aria-pressed", String(button.dataset["catalogView"] === query.view));
    }
    const search = Object.fromEntries(serializeCatalogQuery(query));
    history.replaceState(history.state, "", withUrlExtras(location.pathname, { query: search }));
    updateMap(options.refreshMap === true);
  };

  const onInput = () => {
    // The map area is not a form control: keep it while the other filters change.
    const { filters } = parseCatalogQuery(formParams(form));
    query = { filters: { ...filters, bounds: query.filters.bounds }, view: query.view };
    render();
  };
  const setBounds = (bounds: MapBounds | undefined) => {
    query = { ...query, filters: { ...query.filters, bounds } };
    render();
  };
  const onSubmit = (event: SubmitEvent) => {
    event.preventDefault();
    onInput();
  };
  const onClick = (event: MouseEvent) => {
    if (!(event.target instanceof Element)) return;
    const viewButton = event.target.closest<HTMLElement>("[data-catalog-view]");
    const view = viewButton?.dataset["catalogView"];
    if (isView(view)) {
      query = { ...query, view };
      render({ refreshMap: true });
      return;
    }
    if (event.target.closest("[data-catalog-search-area]") !== null) {
      void map?.then((controller) => setBounds(controller.getBounds()));
      return;
    }
    if (event.target.closest("[data-catalog-clear-area]") !== null) {
      setBounds(undefined);
      return;
    }
    if (event.target.closest("[data-catalog-clear]") !== null) {
      query = {
        filters: { ...DEFAULT_CATALOG_QUERY.filters, sort: query.filters.sort },
        view: query.view,
      };
      setControls(form, query);
      render();
    }
  };

  // `input` bubbles from the form and from controls attached to it with `form=` (sort select).
  root.addEventListener("input", onInput);
  form.addEventListener("submit", onSubmit);
  root.addEventListener("click", onClick);

  setControls(form, query);
  render({ refreshMap: true });

  return () => {
    disposed = true;
    root.removeEventListener("input", onInput);
    form.removeEventListener("submit", onSubmit);
    root.removeEventListener("click", onClick);
    void map?.then((controller) => controller.destroy());
  };
}

document.addEventListener("astro:page-load", () => {
  const root = document.querySelector<HTMLElement>("[data-catalog]");
  if (root !== null) teardown = init(root);
});

document.addEventListener("astro:before-swap", () => {
  teardown?.();
  teardown = undefined;
});
