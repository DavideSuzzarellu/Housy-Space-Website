import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, envField, fontProviders } from "astro/config";
import { PROPERTY_SHEET_SOURCE_DIR } from "./src/features/properties/application/propertySheetBuild";
import { DEFAULT_LOCALE, LOCALE_META, LOCALES } from "./src/shared/i18n/config";

const sitemapLocales = Object.fromEntries(
  LOCALES.map((locale) => [locale, LOCALE_META[locale].langTag]),
);

// Hosting/adapter is not decided yet (AGENTS.md §2): keep this config adapter-agnostic.
export default defineConfig({
  site: "https://www.housyspace.com",
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
  redirects: {
    "/": `/${DEFAULT_LOCALE}`,
  },

  image: {
    remotePatterns: [{ protocol: "https", hostname: "media.mobiliagestion.es" }],
  },

  env: {
    schema: {
      CLIENT_ID: envField.string({ context: "server", access: "secret" }),
      CLIENT_SECRET: envField.string({ context: "server", access: "secret" }),
      GOOGLE_PLACES_API_KEY: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
      GOOGLE_PLACE_ID: envField.string({ context: "server", access: "secret", optional: true }),
      PUBLIC_VALUATOR_URL: envField.string({
        context: "client",
        access: "public",
        optional: true,
        url: true,
      }),
    },
  },

  // Self-hosted fonts via the Astro Fonts API (downloaded at build time, served from this site).
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: "Montserrat",
      cssVariable: "--font-montserrat",
      // Only the weights the UI uses (body 400, `font-medium` 500). Add a weight here before
      // using it in a class, or the browser falls back to the nearest one.
      weights: ["400", "500"],
      styles: ["normal"],
      // latin-ext covers Catalan/Italian/Spanish edge glyphs; unicode-range means its files are
      // only downloaded when a page actually contains such characters.
      subsets: ["latin", "latin-ext"],
      fallbacks: ["ui-sans-serif", "system-ui", "sans-serif"],
    },
    {
      provider: fontProviders.fontsource(),
      name: "Cormorant Garamond",
      cssVariable: "--font-cormorant-garamond",
      // Headings and titles are `font-normal` (global.css): one file covers them all.
      weights: ["400"],
      styles: ["normal"],
      subsets: ["latin", "latin-ext"],
      fallbacks: ["ui-serif", "Georgia", "serif"],
    },
  ],

  integrations: [
    sitemap({
      // Property sheet sources are internal: printed to PDF and removed after the build.
      filter: (page) => !new URL(page).pathname.startsWith(`/${PROPERTY_SHEET_SOURCE_DIR}/`),
      i18n: {
        defaultLocale: DEFAULT_LOCALE,
        locales: sitemapLocales,
      },
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
