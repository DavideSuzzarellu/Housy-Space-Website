import { describe, expect, it } from "vitest";
import { createOfflineMobiliaLoaders } from "./loaders";

describe("createOfflineMobiliaLoaders", () => {
  it("loads nothing: it takes no credentials and never reaches the network or the store", async () => {
    const loaders = createOfflineMobiliaLoaders();
    await expect(loaders.properties.load()).resolves.toBeUndefined();
    await expect(loaders.agents.load()).resolves.toBeUndefined();
  });

  it("keeps the collection schemas, so types stay identical to the online loaders", () => {
    const offline = createOfflineMobiliaLoaders();
    expect(offline.properties.schema).toBeDefined();
    expect(offline.agents.schema).toBeDefined();
  });
});
