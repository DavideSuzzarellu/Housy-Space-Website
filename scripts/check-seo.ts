/**
 * Audits the SEO of the built site in `dist` (run `bun run build` first, then `bun run check:seo`):
 * head tags of every page, reciprocal hreflang, redirect pages, sitemap and robots.txt.
 * Exits with 1 and prints every problem; used locally and as a CI gate.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { auditRedirects, auditSite } from "../src/shared/lib/seo/headAudit.ts";
import { blocksWholeSite } from "../src/shared/lib/seo/robotsTxt.ts";
import { readDistPages } from "./seo-dist.ts";

const DIST = fileURLToPath(new URL("../dist/", import.meta.url));
const HREFLANGS = ["es-ES", "en", "it-IT", "ca-ES"] as const;

// A staging build (any origin but the production one) is noindex and blocked in robots.txt: there
// is nothing to audit, and an empty "0 problems" would be a false pass.
const robots = readFileSync(path.join(DIST, "robots.txt"), "utf8");
if (blocksWholeSite(robots)) {
  console.log(
    "dist is a non-indexable build (robots.txt blocks the site: origin is not the production one).\n" +
      "The SEO audit needs the production build: run `bun run build:production && bun run check:seo`.",
  );
  process.exit(0);
}

const pages = readDistPages(DIST);
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

if (!/^Sitemap: \S*sitemap-index\.xml$/m.test(robots)) problems.push("robots.txt: no Sitemap line");
if (/^Disallow:\s*\/(_astro|brand|media)?\/?$/m.test(robots)) {
  problems.push("robots.txt: blocks the site or its assets");
}

// `_redirects` (production build): every destination must be a page of this build.
const redirectsFile = path.join(DIST, "_redirects");
if (existsSync(redirectsFile)) {
  const destinations = new Set(
    readFileSync(redirectsFile, "utf8")
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line) => new URL(line.split(" ")[1] ?? "").pathname),
  );
  for (const destination of destinations) {
    const target = path.join(DIST, destination);
    if (!existsSync(path.join(target, "index.html")) && !existsSync(`${target}.html`)) {
      problems.push(`_redirects: destination ${destination} is not a page of this build`);
    }
  }
}

console.log(
  `${pages.length} pages (${indexable.length} indexable, ${listed.size} in the sitemap), ${problems.length} problems`,
);
for (const problem of problems.slice(0, 80)) console.log(`- ${problem}`);
if (problems.length > 80) console.log(`... and ${problems.length - 80} more`);
process.exit(problems.length === 0 ? 0 : 1);
