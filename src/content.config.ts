import { marketSchema } from "./features/districts/infrastructure/marketSchema";
import { pageSchema } from "./features/pages/infrastructure/pageSchema";
import { glob } from "astro/loaders";
import { defineCollection } from "astro:content";
import { CLIENT_ID, CLIENT_SECRET } from "astro:env/server";
import { homeContentSchema } from "@/features/agency/infrastructure/homeContentSchema";
import { blogSchema } from "@/features/blog/infrastructure/blogSchema";
import { testimonialSchema } from "@/features/reviews/infrastructure/testimonialSchema";
import { createMobiliaLoaders } from "@/features/properties/infrastructure/mobilia/loaders";

// Build-time collections backed by the read-only Mobilia CRM (AGENTS.md §3.2, §5).
// Incremental sync and CI caching: docs/content-sync.md.
const mobilia = createMobiliaLoaders({ clientId: CLIENT_ID, clientSecret: CLIENT_SECRET });

export const collections = {
  properties: defineCollection({ loader: mobilia.properties }),
  agents: defineCollection({ loader: mobilia.agents }),
  testimonials: defineCollection({
    loader: glob({ pattern: "*.json", base: "./src/content/testimonials" }),
    schema: testimonialSchema,
  }),
  blog: defineCollection({
    loader: glob({ pattern: "*.md", base: "./src/content/blog" }),
    schema: ({ image }) => blogSchema(image),
  }),
  // Editorial content edited by the client in Pages CMS (`.pages.yml`): one file per locale,
  // the entry id is the locale (`es`, `en`, `it`, `ca`).
  pages: defineCollection({
    loader: glob({
      pattern: "*.json",
      base: "./src/content/pages",
      // `{key}.{locale}`: the default id generator would drop the dot.
      generateId: ({ entry }) => entry.replace(/\.json$/, ""),
    }),
    schema: ({ image }) => pageSchema(image),
  }),
  market: defineCollection({
    loader: glob({ pattern: "*.json", base: "./src/content/market" }),
    schema: marketSchema,
  }),
  home: defineCollection({
    loader: glob({ pattern: "*.json", base: "./src/content/home" }),
    schema: ({ image }) => homeContentSchema(image),
  }),
};
