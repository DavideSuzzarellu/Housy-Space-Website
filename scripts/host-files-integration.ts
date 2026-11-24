import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { AstroIntegration } from "astro";
import { renderHostRedirects } from "../src/shared/i18n/hostRedirects.ts";
import { renderHeadersFile } from "../src/shared/lib/seo/hostHeaders.ts";
import { isIndexableSite } from "../src/shared/lib/seo/indexability.ts";

/**
 * Production build only: writes `_redirects` (real 301s, absolute destinations on the canonical
 * origin, from the single sources `retiredRoutes.ts` and `legacyRoutes.ts`) and `_headers` into
 * `dist`. The meta-refresh pages stay as the fallback for hosts that ignore both files. Staging
 * (GitHub Pages, any non-production origin) gets neither: the host ignores them and the base
 * prefix would be wrong.
 */
export function hostFiles(site: string, base: string): AstroIntegration {
  return {
    name: "host-files",
    hooks: {
      "astro:build:done": ({ dir }) => {
        const origin = new URL(site);
        if (!isIndexableSite(origin)) return;
        const dist = fileURLToPath(dir);
        const prefix = base === "/" ? "" : base;
        writeFileSync(path.join(dist, "_redirects"), renderHostRedirects(origin.origin, prefix));
        writeFileSync(path.join(dist, "_headers"), renderHeadersFile());
      },
    },
  };
}
