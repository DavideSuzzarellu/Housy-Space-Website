/** Internal print sources (property sheet PDFs); never meant for crawlers. */
const PRIVATE_PATHS = ["/property-sheet-source/"] as const;

/** `robots.txt` of a site that must not be indexed (staging, previews): block everything, no sitemap. */
export function renderBlockedRobotsTxt(): string {
  return "User-agent: *\nDisallow: /\n";
}

/** True when a `robots.txt` text blocks the whole site (what `check-seo` reads from `dist`). */
export function blocksWholeSite(robots: string): boolean {
  return /^Disallow:\s*\/\s*$/m.test(robots);
}

/**
 * `robots.txt`: crawl everything public (assets included, so pages render for Google) and point
 * to the sitemap index. Indexing is controlled per page with the robots meta tag, never here.
 */
export function renderRobotsTxt(
  siteUrl: string,
  privatePaths: readonly string[] = PRIVATE_PATHS,
): string {
  const lines = [
    "User-agent: *",
    "Allow: /",
    ...privatePaths.map((path) => `Disallow: ${path}`),
    "",
    `Sitemap: ${siteUrl}/sitemap-index.xml`,
  ];
  return `${lines.join("\n")}\n`;
}
