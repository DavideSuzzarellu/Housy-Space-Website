/**
 * Current `import.meta.env.BASE_URL`, "/" when absent: `import.meta.env` does not exist outside
 * Vite (Playwright specs import the route map). Read per call so tests can stub it.
 */
export function currentBaseUrl(): string {
  const env: Partial<ImportMetaEnv> | undefined = import.meta.env;
  return env?.BASE_URL ?? "/";
}

/**
 * Root-relative URL of a file in `public/` under the deploy base (`base` in astro.config, e.g. a
 * GitHub Pages project site). Absolute URLs pass through.
 */
export function withBase(path: string, base: string = currentBaseUrl()): string {
  if (!path.startsWith("/")) return path;
  const prefix = base.endsWith("/") ? base.slice(0, -1) : base;
  return `${prefix}${path}`;
}
