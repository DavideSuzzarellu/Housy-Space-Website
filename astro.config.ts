import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, envField, fontProviders } from "astro/config";
import { sitemapFromHeads } from "./scripts/sitemap-integration";
import { PROPERTY_SHEET_SOURCE_DIR } from "./src/features/properties/application/propertySheetBuild";
import { DEFAULT_LOCALE, LOCALE_META, LOCALES } from "./src/shared/i18n/config";
import { getRetiredRedirects } from "./src/shared/i18n/retiredRoutes";

const sitemapLocales = Object.fromEntries(
  LOCALES.map((locale) => [locale, LOCALE_META[locale].langTag]),
);

// GitHub Pages serves the site under the repository name; the e2e build overrides it with
// ASTRO_BASE="/" (and ASTRO_SITE to the production origin the specs assert) so tests run against the site root.
const BASE = process.env["ASTRO_BASE"] ?? "/Housy-Space-Website";
const BASE_PREFIX = BASE === "/" ? "" : BASE;

// Hosting/adapter is not decided yet (AGENTS.md §2): keep this config adapter-agnostic.
export default defineConfig({
  site: process.env["ASTRO_SITE"] ?? "https://DavideSuzzarellu.github.io",
  // Reemplazá con el nombre exacto de tu repositorio
  base: BASE,
  output: "static",
  trailingSlash: "never",
  i18n: {
    locales: [...LOCALES],
    defaultLocale: DEFAULT_LOCALE,
    routing: {
      prefixDefaultLocale: true,
    },
  },

  // `/` → `/es`. Without an adapter or host-level redirect rules, a static build emits a
  // meta-refresh page here, NOT a real HTTP 301 (AGENTS.md §4.1). Replace with an adapter
  // or host redirect rule once hosting is decided.
  // redirects: {
  //   "/": `/${DEFAULT_LOCALE}`,
  // },
  redirects: {
    "/": `${BASE_PREFIX}/${DEFAULT_LOCALE}/`,
    // Pages retired in the reference site: sell page, advisory service (same meta-refresh caveat).
    ...Object.fromEntries(
      Object.entries(getRetiredRedirects()).map(([from, to]) => [
        from,
        `${BASE_PREFIX}${to}`,
      ]),
    ),
  },

  image: {
    remotePatterns: [{ protocol: "https", hostname: "media.mobiliagestion.es" }],
  },

  env: {
    schema: {
      CLIENT_ID: envField.string({ context: "server", access: "secret" }),
      CLIENT_SECRET: envField.string({ context: "server", access: "secret" }),
      PUBLIC_VALUATOR_URL: envField.string({
        context: "client",
        access: "public",
        optional: true,
        url: true,
        default: "https://valuation.lystos.com?clientId=0cf1b7eb-0479-481f-9d1d-61a1697d5b31",
      }),
    },
  },

  // Self-hosted fonts via the Astro Fonts API (downloaded at build time, served from this site).
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: "Montserrat",
      cssVariable: "--font-montserrat",
      // Body 400, buttons 500, labels 700, headings 800/900 (design system, AGENTS.md §11.3).
      weights: ["400 900"],
      styles: ["normal"],
      // latin-ext covers Catalan/Italian/Spanish edge glyphs; unicode-range means its files are
      // only downloaded when a page actually contains such characters.
      subsets: ["latin", "latin-ext"],
      fallbacks: ["ui-sans-serif", "system-ui", "sans-serif"],
    },
  ],
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "hover",
  },
  integrations: [
    sitemap({
      // Property sheet sources are internal: printed to PDF and removed after the build.
      filter: (page) => !new URL(page).pathname.startsWith(`/${PROPERTY_SHEET_SOURCE_DIR}/`),
      i18n: {
        defaultLocale: DEFAULT_LOCALE,
        locales: sitemapLocales,
      },
    }),
    // Rewrites sitemap-0.xml from the emitted heads (translated slugs need real alternates).
    sitemapFromHeads(),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
