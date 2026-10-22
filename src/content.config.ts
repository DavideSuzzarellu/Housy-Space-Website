import { defineCollection } from "astro:content";
import { CLIENT_ID, CLIENT_SECRET } from "astro:env/server";
import { createMobiliaLoaders } from "@/features/properties/infrastructure/mobilia/loaders";

// Build-time collections backed by the read-only Mobilia CRM (AGENTS.md §3.2, §5).
// Incremental sync and CI caching: docs/content-sync.md.
const mobilia = createMobiliaLoaders({ clientId: CLIENT_ID, clientSecret: CLIENT_SECRET });

export const collections = {
  properties: defineCollection({ loader: mobilia.properties }),
  agents: defineCollection({ loader: mobilia.agents }),
};
