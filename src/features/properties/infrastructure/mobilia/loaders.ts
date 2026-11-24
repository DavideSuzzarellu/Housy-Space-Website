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

/** Development only: parallel worktrees run with `CLIENT_ID=placeholder` instead of real secrets. */
const PLACEHOLDER_CLIENT_ID = "placeholder";

function skipSync<L extends Loader>(loader: L): L {
  return {
    ...loader,
    load: ({ logger }) => {
      logger.warn("Mobilia sync skipped: placeholder credentials (development only)");
      return Promise.resolve();
    },
  };
}

/** Both loaders share one client, hence one cached OAuth token per build. */
export function createMobiliaLoaders(credentials: MobiliaCredentials) {
  const client = createMobiliaClient(credentials);
  const loaders = {
    properties: mobiliaPropertiesLoader(client),
    agents: mobiliaAgentsLoader(client),
  };
  if (credentials.clientId !== PLACEHOLDER_CLIENT_ID) return loaders;
  return { properties: skipSync(loaders.properties), agents: skipSync(loaders.agents) };
}
