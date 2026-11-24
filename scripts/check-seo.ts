/**
 * Audits the SEO of the built site in `dist` (run `bun run build` first, then `bun run check:seo`):
 * head tags of every page, reciprocal hreflang, redirect pages, sitemap and robots.txt.
 * Exits with 1 and prints every problem; used locally and as a CI gate.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  auditRedirects,
  auditSite,
  parseHead,
  type PageHead,
} from "../src/shared/lib/seo/headAudit.ts";

const DIST = fileURLToPath(new URL("../dist/", import.meta.url));
/** Internal sources printed to PDF; never public. */
const INTERNAL = /(^|\/)property-sheet-source\//;
const HREFLANGS = ["es-ES", "en", "it-IT", "ca-ES"] as const;

function htmlFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return htmlFiles(full);
    return full.endsWith(".html") ? [full] : [];
  });
}

const pages: PageHead[] = htmlFiles(DIST)
  .map((file) => path.relative(DIST, file).replaceAll("\\", "/"))
  .filter((file) => !INTERNAL.test(file))
  .map((file) => parseHead(file, readFileSync(path.join(DIST, file), "utf8")));

const problems = [...auditSite(pages, { hreflangs: HREFLANGS }), ...auditRedirects(pages)];

// Sitemap: exactly the indexable pages (no redirect or noindex page, no page missing).
const sitemap = readFileSync(path.join(DIST, "sitemap-0.xml"), "utf8");
const listed = new Set([...sitemap.matchAll(/<loc>([^<]*)<\/loc>/g)].map((match) => match[1]));
const indexable = pages.filter(
  (page) => !page.isRedirect && !(page.robots ?? "").includes("noindex"),
);
const canonicals = new Set(indexable.map((page) => page.canonical));
for (const page of indexable) {
  if (page.canonical !== undefined && !listed.has(page.canonical)) {
    problems.push(`${page.file}: indexable page missing from the sitemap`);
  }
}
for (const url of listed) {
  if (url !== undefined && !canonicals.has(url)) {
    problems.push(`sitemap lists ${url}, which is not an indexable page`);
  }
}

const robots = readFileSync(path.join(DIST, "robots.txt"), "utf8");
if (!/^Sitemap: \S*sitemap-index\.xml$/m.test(robots)) problems.push("robots.txt: no Sitemap line");
if (/^Disallow:\s*\/(_astro|brand|media)?\/?$/m.test(robots)) {
  problems.push("robots.txt: blocks the site or its assets");
}

console.log(
  `${pages.length} pages (${indexable.length} indexable, ${listed.size} in the sitemap), ${problems.length} problems`,
);
for (const problem of problems.slice(0, 80)) console.log(`- ${problem}`);
if (problems.length > 80) console.log(`... and ${problems.length - 80} more`);
process.exit(problems.length === 0 ? 0 : 1);
