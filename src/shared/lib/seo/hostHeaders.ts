/**
 * `_headers` file (Cloudflare Pages/Workers assets and Netlify syntax) of the production build.
 * Only response headers that are safe for any host and need no tuning; no CSP (it depends on the
 * embeds and the host, and is decided with hosting).
 */
export function renderHeadersFile(): string {
  return [
    "/*",
    "  X-Content-Type-Options: nosniff",
    "  Referrer-Policy: strict-origin-when-cross-origin",
    "",
  ].join("\n");
}
