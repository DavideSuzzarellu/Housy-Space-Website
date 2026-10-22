import type { Loader } from "astro/loaders";
import { syncAgents } from "./agents";
import { createMobiliaClient, type MobiliaClient } from "./client";
import { agentSchema, propertySchema } from "./collectionSchemas";
import { syncProperties } from "./syncProperties";

export interface MobiliaCredentials {
  readonly clientId: string;
  readonly clientSecret: string;
}

export function mobiliaPropertiesLoader(client: MobiliaClient) {
  return {
    name: "mobilia-properties",
    schema: propertySchema,
    load: async (context) => {
      await syncProperties(client, context);
    },
  } satisfies Loader;
}

export function mobiliaAgentsLoader(client: MobiliaClient) {
  return {
    name: "mobilia-agents",
    schema: agentSchema,
    load: async (context) => {
      await syncAgents(client, context);
    },
  } satisfies Loader;
}

/** Both loaders share one client, hence one cached OAuth token per build. */
export function createMobiliaLoaders(credentials: MobiliaCredentials) {
  const client = createMobiliaClient(credentials);
  return {
    properties: mobiliaPropertiesLoader(client),
    agents: mobiliaAgentsLoader(client),
  };
}
