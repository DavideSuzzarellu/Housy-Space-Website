import type { AgentId } from "@/features/properties/domain/property";
import type { Agent } from "../domain/agent";

/** Port: where agents come from (content collection in production, fakes in tests). */
export type AgentSource = () => Promise<readonly Agent[]>;

/** What a listing page may show about its agent (no email: personal data, §5/§7). */
export interface ListingAgent {
  readonly name: string;
}

/** Mobilia user names are sometimes login emails: those are not a public name. */
function publicName(agent: Agent): string | undefined {
  const name = agent.name.trim();
  return name === "" || name.includes("@") ? undefined : name;
}

export function createAgentQueries(source: AgentSource) {
  return {
    async getListingAgent(id: AgentId | undefined): Promise<ListingAgent | undefined> {
      if (id === undefined) return undefined;
      const agent = (await source()).find((candidate) => candidate.id === id);
      const name = agent === undefined ? undefined : publicName(agent);
      return name === undefined ? undefined : { name };
    },
  };
}
