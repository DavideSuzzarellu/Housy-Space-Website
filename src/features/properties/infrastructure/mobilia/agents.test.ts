import { describe, expect, it } from "vitest";
import agentesFixture from "../../../../../tests/fixtures/mobilia/agentes.json";
import type { MobiliaClient } from "./client";
import { mapAgente, syncAgents } from "./agents";
import { mobiliaAgenteSchema } from "./schemas";
import type { SyncRuntime } from "./syncProperties";

describe("mapAgente", () => {
  it("maps id, name and email from the recorded fixture", () => {
    const [first] = agentesFixture.elementos;
    const agent = mapAgente(mobiliaAgenteSchema.parse(first));
    expect(agent).toEqual({
      id: 5754280,
      name: "Agent 1 (redacted)",
      email: "agent1@example.com",
    });
  });

  it("returns undefined when the agent has no name", () => {
    expect(
      mapAgente(mobiliaAgenteSchema.parse({ idAgente: 1, nombreUsuario: "  " })),
    ).toBeUndefined();
  });

  it("drops invalid emails", () => {
    expect(
      mapAgente(mobiliaAgenteSchema.parse({ idAgente: 1, nombreUsuario: "Ana", email: "nope" })),
    ).toEqual({ id: 1, name: "Ana", email: undefined });
  });
});

describe("syncAgents", () => {
  it("replaces the store with every valid agent", async () => {
    const entries = new Map<string, Record<string, unknown>>([["999", {}]]);
    const runtime: SyncRuntime = {
      store: {
        set: (entry) => entries.set(entry.id, entry.data),
        delete: (id) => {
          entries.delete(id);
        },
        clear: () => {
          entries.clear();
        },
      },
      meta: { get: () => undefined, set: () => undefined },
      logger: { info: () => undefined, warn: () => undefined },
      parseData: async ({ data }) => data,
      generateDigest: () => "d",
    };
    const client: MobiliaClient = {
      getAccessToken: async () => "t",
      listInmuebles: async () => [],
      listDesactivados: async () => [],
      listAgentes: async () => [...agentesFixture.elementos, { idAgente: "bad" }],
    };
    await syncAgents(client, runtime);
    expect([...entries.keys()].sort()).toEqual(["5754264", "5754280"]);
  });
});
