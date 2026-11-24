/**
 * Deploy sub-path without trailing slash ("" at the site root). `import.meta.env` is absent when
 * a module runs outside Vite (Playwright specs import the route map), hence the optional read.
 */
const env: Partial<ImportMetaEnv> | undefined = import.meta.env;
const baseUrl = env?.BASE_URL ?? "/";

export const BASE_PATH: string = baseUrl === "/" ? "" : baseUrl;
