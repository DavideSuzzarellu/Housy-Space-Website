import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { parseHead, type PageHead } from "../src/shared/lib/seo/headAudit.ts";

/** Internal sources printed to PDF (then deleted); never public pages. */
const INTERNAL = /(^|\/)property-sheet-source\//;

function htmlFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return htmlFiles(full);
    return full.endsWith(".html") ? [full] : [];
  });
}

/** The parsed SEO head of every public HTML page of a build (`dist`). */
export function readDistPages(dist: string): PageHead[] {
  return htmlFiles(dist)
    .map((file) => path.relative(dist, file).replaceAll("\\", "/"))
    .filter((file) => !INTERNAL.test(file))
    .map((file) => parseHead(file, readFileSync(path.join(dist, file), "utf8")));
}
