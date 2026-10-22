import { describe, expect, it } from "vitest";
import desactivadosFixture from "../../../../../tests/fixtures/mobilia/desactivados.json";
import inmueblesFixture from "../../../../../tests/fixtures/mobilia/inmuebles.json";
import type { MobiliaClient } from "./client";
import {
  LAST_SYNC_KEY,
  SCHEMA_VERSION,
  SCHEMA_VERSION_KEY,
  syncProperties,
  type SyncRuntime,
} from "./syncProperties";

const items: readonly Record<string, unknown>[] = inmueblesFixture.elementos;

function itemByRef(ref: string, overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const item = items.find((candidate) => candidate["referencia"] === ref);
  if (item === undefined) throw new Error(`fixture ${ref} missing`);
  return { ...item, ...overrides };
}

function fakeRuntime(initialMeta: Record<string, string> = {}, initialIds: string[] = []) {
  const entries = new Map<string, Record<string, unknown>>(
    initialIds.map((id) => [id, { stale: true }]),
  );
  const meta = new Map(Object.entries(initialMeta));
  const logs: string[] = [];
  const runtime: SyncRuntime = {
    store: {
      set: (entry) => {
        entries.set(entry.id, entry.data);
        return true;
      },
      delete: (id) => {
        entries.delete(id);
      },
      clear: () => {
        entries.clear();
      },
    },
    meta: {
      get: (key) => meta.get(key),
      set: (key, value) => {
        meta.set(key, value);
      },
    },
    logger: {
      info: (message) => logs.push(message),
      warn: (message) => logs.push(`WARN ${message}`),
    },
    parseData: async ({ data }) => data,
    generateDigest: (data) => JSON.stringify(data).length.toString(),
  };
  return { runtime, entries, meta, logs };
}

function fakeClient(options: {
  readonly inmuebles?: readonly unknown[];
  readonly desactivados?: readonly unknown[];
  readonly fail?: boolean;
}) {
  const listCalls: { modifiedSince?: string }[] = [];
  let desactivadosCalls = 0;
  const client: MobiliaClient = {
    getAccessToken: async () => "token",
    listInmuebles: async (listOptions = {}) => {
      listCalls.push(listOptions);
      if (options.fail === true) throw new Error("HTTP 503");
      return [...(options.inmuebles ?? items)];
    },
    listDesactivados: async () => {
      desactivadosCalls += 1;
      return [...(options.desactivados ?? desactivadosFixture.elementos)];
    },
    listAgentes: async () => [],
  };
  return { client, listCalls, desactivadosCalls: () => desactivadosCalls };
}

const NOW = new Date("2026-10-21T08:00:00.000Z");

describe("syncProperties — full sync", () => {
  it("runs a full sync when meta is empty: clears, stores published entries, records lastSync", async () => {
    const { runtime, entries, meta } = fakeRuntime({}, ["old-ref"]);
    const { client, listCalls } = fakeClient({});
    const result = await syncProperties(client, runtime, { now: () => NOW });

    expect(result.mode).toBe("full");
    expect(listCalls).toEqual([{}]);
    expect([...entries.keys()].sort()).toEqual(["1001", "1002", "1003", "1004"]);
    expect(meta.get(LAST_SYNC_KEY)).toBe(NOW.toISOString());
    expect(meta.get(SCHEMA_VERSION_KEY)).toBe(SCHEMA_VERSION);
  });

  it("never stores listings that are not published on the web or not active", async () => {
    const { runtime, entries } = fakeRuntime();
    const { client } = fakeClient({
      inmuebles: [
        itemByRef("1001"),
        itemByRef("1002", { publicarEnWeb: false }),
        itemByRef("1003", { activo: false }),
      ],
    });
    await syncProperties(client, runtime, { now: () => NOW });
    expect([...entries.keys()]).toEqual(["1001"]);
  });

  it("skips invalid items with a warning that names only the reference", async () => {
    const { runtime, entries, logs } = fakeRuntime();
    const { client } = fakeClient({
      inmuebles: [itemByRef("1001"), { referencia: "BAD-1", fotos: "not-an-array" }, 42],
    });
    await syncProperties(client, runtime, { now: () => NOW });
    expect([...entries.keys()]).toEqual(["1001"]);
    expect(logs.filter((line) => line.startsWith("WARN"))).toHaveLength(2);
    expect(logs.join("\n")).toContain("BAD-1");
  });

  it("re-runs a full sync when the stored schema version differs", async () => {
    const { runtime } = fakeRuntime({
      [LAST_SYNC_KEY]: "2026-10-20T00:00:00.000Z",
      [SCHEMA_VERSION_KEY]: "0",
    });
    const { client, listCalls } = fakeClient({});
    const result = await syncProperties(client, runtime, { now: () => NOW });
    expect(result.mode).toBe("full");
    expect(listCalls).toEqual([{}]);
  });

  it("keeps the previous store and meta when Mobilia fails", async () => {
    const { runtime, entries, meta } = fakeRuntime({}, ["kept"]);
    const { client } = fakeClient({ fail: true });
    await expect(syncProperties(client, runtime, { now: () => NOW })).rejects.toThrow();
    expect([...entries.keys()]).toEqual(["kept"]);
    expect(meta.get(LAST_SYNC_KEY)).toBeUndefined();
  });
});

describe("syncProperties — incremental sync", () => {
  const previousSync = "2026-10-20T08:00:00.000Z";
  const incrementalMeta = { [LAST_SYNC_KEY]: previousSync, [SCHEMA_VERSION_KEY]: SCHEMA_VERSION };

  it("requests only properties modified since the last sync (minus a clock-skew margin)", async () => {
    const { runtime } = fakeRuntime(incrementalMeta);
    const { client, listCalls } = fakeClient({ inmuebles: [] });
    const result = await syncProperties(client, runtime, { now: () => NOW });
    expect(result.mode).toBe("incremental");
    expect(listCalls).toEqual([{ modifiedSince: "2026-10-20T07:55:00.000Z" }]);
  });

  it("upserts changed entries without clearing the others", async () => {
    const { runtime, entries } = fakeRuntime(incrementalMeta, ["1001", "1002"]);
    const { client } = fakeClient({ inmuebles: [itemByRef("1001", { precioVenta: 320000 })] });
    await syncProperties(client, runtime, { now: () => NOW });
    expect(entries.get("1002")).toEqual({ stale: true });
    expect(entries.get("1001")).toMatchObject({
      prices: { sale: { kind: "amount", amount: 320000 } },
    });
  });

  it("removes deactivated references and listings that were unpublished", async () => {
    const { runtime, entries, meta } = fakeRuntime(incrementalMeta, ["1001", "1002", "1003"]);
    const { client } = fakeClient({
      inmuebles: [itemByRef("1003", { publicarEnWeb: false })],
      desactivados: [itemByRef("1002"), { referencia: "UNKNOWN" }],
    });
    const result = await syncProperties(client, runtime, { now: () => NOW });
    expect([...entries.keys()]).toEqual(["1001"]);
    expect(result.removed).toBe(3); // deletions requested, including the unknown ref (a no-op)
    expect(meta.get(LAST_SYNC_KEY)).toBe(NOW.toISOString());
  });

  it("does not call /inmuebles/desactivados on a full sync", async () => {
    const { runtime } = fakeRuntime();
    const fake = fakeClient({});
    await syncProperties(fake.client, runtime, { now: () => NOW });
    expect(fake.desactivadosCalls()).toBe(0);
  });
});
