import type { PageHead } from "./headAudit";

const ESCAPES: Readonly<Record<string, string>> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
};
const escapeXml = (value: string): string =>
  value.replace(/[&<>"]/g, (char) => ESCAPES[char] ?? char);

/**
 * `sitemap-0.xml` built from the heads the site really emits: one `<url>` per indexable page,
 * with the same hreflang alternates as its `<head>`. `@astrojs/sitemap` pairs alternates by URL
 * suffix, which cannot match translated slugs (`/es/servicios` ↔ `/en/services`), so the head
 * (built with `getAlternates`) is the single source of truth.
 */
export function buildSitemapXml(pages: readonly PageHead[]): string {
  const seen = new Set<string>();
  const urls: string[] = [];
  for (const page of pages) {
    const { canonical } = page;
    if (page.isRedirect || (page.robots ?? "").includes("noindex")) continue;
    if (canonical === undefined || seen.has(canonical)) continue;
    seen.add(canonical);
    const links = page.alternates
      .map(
        (alternate) =>
          `<xhtml:link rel="alternate" hreflang="${escapeXml(alternate.hreflang)}" href="${escapeXml(alternate.href)}"/>`,
      )
      .join("");
    urls.push(`<url><loc>${escapeXml(canonical)}</loc>${links}</url>`);
  }
  urls.sort();
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls.join("")}</urlset>`;
}
