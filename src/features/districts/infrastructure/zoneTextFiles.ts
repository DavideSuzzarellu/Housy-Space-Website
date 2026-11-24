import { zoneTextSchema, type ZoneText } from "./zoneTextSchema";

/**
 * Reads every `src/content/market/text/{locale}/{districts|barrios}/{slug}.json` through Vite
 * (tests only: the site reads them through the `marketText` collection). Keyed by `zoneTextId`.
 * Districts and barrios have separate folders because two slugs collide (`les-corts`, `sant-andreu`).
 */
const files = import.meta.glob("../../../content/market/text/*/*/*.json", {
  eager: true,
  import: "default",
});

export const ZONE_TEXT_FILES: ReadonlyMap<string, ZoneText> = new Map(
  Object.entries(files).map(([path, raw]) => {
    const id = path.replace(/^.*\/text\//, "").replace(/\.json$/, "");
    return [id, zoneTextSchema.parse(raw)];
  }),
);
