/**
 * Root-relative URL of a file in `public/` under the deploy base (`base` in astro.config, e.g. a
 * GitHub Pages project site). Absolute URLs pass through.
 */
export function withBase(path: string, base: string = import.meta.env.BASE_URL): string {
  if (!path.startsWith("/")) return path;
  const prefix = base.endsWith("/") ? base.slice(0, -1) : base;
  return `${prefix}${path}`;
}
