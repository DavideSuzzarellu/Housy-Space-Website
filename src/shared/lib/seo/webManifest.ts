import { DEFAULT_LOCALE } from "@/shared/i18n/config";
import { withBase } from "@/shared/lib/basePath";

/** Browser chrome and splash colour: the one the reference site declares (`#102124`). */
export const THEME_COLOR = "#102124";

const ICON_DIR = "/brand/icons";

interface ManifestIcon {
  readonly src: string;
  readonly sizes: string;
  readonly type: "image/png";
  readonly purpose?: "maskable";
}

export interface WebManifest {
  readonly name: string;
  readonly short_name: string;
  readonly description: string;
  readonly lang: string;
  readonly start_url: string;
  readonly scope: string;
  readonly display: "browser";
  readonly background_color: string;
  readonly theme_color: string;
  readonly icons: readonly ManifestIcon[];
}

/**
 * Web app manifest, as the reference's `site.webmanifest`, but with every URL under the deploy
 * base (`/Housy-Space-Website` on GitHub Pages, `/` on the production domain).
 */
export function buildWebManifest(base: string): WebManifest {
  const prefixed = (path: string): string => withBase(path, base);
  return {
    name: "HousySpace · Property Solutions",
    short_name: "HousySpace",
    description: "Consultores inmobiliarios en Barcelona.",
    lang: DEFAULT_LOCALE,
    start_url: prefixed(`/${DEFAULT_LOCALE}`),
    scope: base.endsWith("/") ? base : `${base}/`,
    display: "browser",
    background_color: THEME_COLOR,
    theme_color: THEME_COLOR,
    icons: [
      { src: prefixed(`${ICON_DIR}/icon-192.png`), sizes: "192x192", type: "image/png" },
      { src: prefixed(`${ICON_DIR}/icon-512.png`), sizes: "512x512", type: "image/png" },
      {
        src: prefixed(`${ICON_DIR}/icon-maskable-512.png`),
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
