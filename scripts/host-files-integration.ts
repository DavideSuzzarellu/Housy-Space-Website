import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { AstroIntegration } from "astro";
import { getRetiredRedirectRules, renderRedirectRules } from "../src/shared/i18n/retiredRoutes.ts";
import { renderHeadersFile } from "../src/shared/lib/seo/hostHeaders.ts";
import { isIndexableSite } from "../src/shared/lib/seo/indexability.ts";

/**
 * Production build only: writes `_redirects` (real 301s from the single source `retiredRoutes.ts`,
 * Cloudflare / Netlify syntax) and `_headers` into `dist`. The meta-refresh pages stay as the
 * fallback for hosts that ignore both files. Staging (GitHub Pages, any non-production origin)
 * gets neither: the host ignores them and the base prefix would be wrong.
 */
export function hostFiles(site: string, base: string): AstroIntegration {
  return {
    name: "host-files",
    hooks: {
      "astro:build:done": ({ dir }) => {
        if (!isIndexableSite(new URL(site))) return;
        const dist = fileURLToPath(dir);
        const prefix = base === "/" ? "" : base;
        writeFileSync(
          path.join(dist, "_redirects"),
          renderRedirectRules(getRetiredRedirectRules(), prefix),
        );
        writeFileSync(path.join(dist, "_headers"), renderHeadersFile());
      },
    },
  };
}
