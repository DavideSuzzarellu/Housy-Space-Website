import { afterEach, describe, expect, it, vi } from "vitest";
import { createMobiliaLoaders } from "./loaders";

type LoadContext = Parameters<ReturnType<typeof createMobiliaLoaders>["properties"]["load"]>[0];

afterEach(() => vi.unstubAllGlobals());

describe("createMobiliaLoaders with placeholder credentials", () => {
  it("skips both syncs without touching the network and says so", async () => {
    const fetchSpy = vi.fn(() => Promise.reject(new Error("network must not be used")));
    vi.stubGlobal("fetch", fetchSpy);
    const warn = vi.fn();
    // Only the logger is read on the skip path: a partial context stands in for Astro's.
    const context = { logger: { warn } } as unknown as LoadContext;

    const loaders = createMobiliaLoaders({ clientId: "placeholder", clientSecret: "placeholder" });
    await loaders.properties.load(context);
    await loaders.agents.load(context);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledTimes(2);
    expect(warn.mock.calls.flat().join(" ")).toMatch(/placeholder credentials/i);
  });
});
