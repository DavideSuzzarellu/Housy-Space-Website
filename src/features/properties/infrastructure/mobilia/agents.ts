import type { Agent } from "@/features/agency/domain/agent";
import { toAgentId } from "../../domain/property";
import type { MobiliaClient } from "./client";
import { mobiliaAgenteSchema, type MobiliaAgente } from "./schemas";
import type { SyncRuntime } from "./syncProperties";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function mapAgente(raw: MobiliaAgente): Agent | undefined {
  const name = raw.nombreUsuario?.trim();
  if (name === undefined || name === "") return undefined;
  const email = raw.email?.trim();
  return {
    id: toAgentId(raw.idAgente),
    name,
    email: email !== undefined && EMAIL.test(email) ? email : undefined,
  };
}

/** Agents are few: always a full replace (fetched before clearing). */
export async function syncAgents(client: MobiliaClient, runtime: SyncRuntime): Promise<void> {
  const agents: Agent[] = [];
  for (const item of await client.listAgentes()) {
    const parsed = mobiliaAgenteSchema.safeParse(item);
    const agent = parsed.success ? mapAgente(parsed.data) : undefined;
    if (agent === undefined) {
      runtime.logger.warn("Skipping invalid Mobilia agent");
      continue;
    }
    agents.push(agent);
  }
  const entries = await Promise.all(
    agents.map(async (agent) => {
      const id = String(agent.id);
      return { id, data: await runtime.parseData({ id, data: agent }) };
    }),
  );
  runtime.store.clear();
  for (const { id, data } of entries) {
    runtime.store.set({ id, data, digest: runtime.generateDigest(data) });
  }
  runtime.logger.info(`Mobilia agents sync: ${entries.length} stored`);
}
