import { describe, expect, it } from "vitest";
import { toAgentId } from "@/features/properties/domain/property";
import type { Agent } from "../domain/agent";
import { createAgentQueries } from "./agentQueries";

const agents: Agent[] = [
  { id: toAgentId(1), name: "Laura Martí", email: "laura@example.com" },
  { id: toAgentId(2), name: "info@example.com" },
];

const queries = createAgentQueries(async () => agents);

describe("getListingAgent", () => {
  it("returns the public contact of the listing agent", async () => {
    expect(await queries.getListingAgent(toAgentId(1))).toEqual({ name: "Laura Martí" });
  });

  it("returns undefined when there is no agent, it is unknown, or its name is an email", async () => {
    expect(await queries.getListingAgent(undefined)).toBeUndefined();
    expect(await queries.getListingAgent(toAgentId(99))).toBeUndefined();
    expect(await queries.getListingAgent(toAgentId(2))).toBeUndefined();
  });
});
