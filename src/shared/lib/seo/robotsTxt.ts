/** Internal print sources (property sheet PDFs); never meant for crawlers. */
const PRIVATE_PATHS = ["/property-sheet-source/"] as const;

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
