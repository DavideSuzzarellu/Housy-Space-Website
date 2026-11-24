import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { AstroIntegration } from "astro";
import { buildSitemapXml } from "../src/shared/lib/seo/sitemapXml.ts";
import { readDistPages } from "./seo-dist.ts";

/**
 * Runs after `@astrojs/sitemap` (list it after it in `integrations`): rewrites `sitemap-0.xml`
 * from the emitted page heads so every URL carries its real hreflang alternates and no
 * `noindex` or redirect page is listed. The sitemap index stays the one the integration wrote.
 */
export function sitemapFromHeads(): AstroIntegration {
  return {
    name: "sitemap-from-heads",
    hooks: {
      "astro:build:done": ({ dir }) => {
        const dist = fileURLToPath(dir);
        writeFileSync(path.join(dist, "sitemap-0.xml"), buildSitemapXml(readDistPages(dist)));
      },
    },
  };
}
