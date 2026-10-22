import { getCollection } from "astro:content";
import type { Agent } from "../domain/agent";
import { createAgentQueries } from "./agentQueries";

/** Production binding of the agent use cases to the `agents` content collection. */
async function agentsFromCollection(): Promise<Agent[]> {
  const entries = await getCollection("agents");
  return entries.map((entry) => entry.data);
}

export const { getListingAgent } = createAgentQueries(agentsFromCollection);

export type { ListingAgent } from "./agentQueries";
