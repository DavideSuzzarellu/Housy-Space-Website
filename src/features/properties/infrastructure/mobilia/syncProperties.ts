import type { Property } from "../../domain/property";
import type { MobiliaClient } from "./client";
import { isPublishable, mapInmueble } from "./mapper";
import { mobiliaInmuebleSchema, type MobiliaInmueble } from "./schemas";

/**
 * Properties sync for the `properties` content collection (AGENTS.md §3.2, §5).
 * - Full sync when meta is empty (or the stored schema version changed): fetch everything
 *   first, then replace the store, so a failed fetch never wipes the previous data.
 * - Incremental sync otherwise: fetch only properties modified since the last sync,
 *   upsert them, and delete refs that were unpublished or listed in `/inmuebles/desactivados`.
 * `lastSync` is written only after the whole sync succeeded.
 */

export const LAST_SYNC_KEY = "lastSync";
export const SCHEMA_VERSION_KEY = "schemaVersion";
/**
 * Bump when the stored `Property` shape or the mapping of its values changes: forces one full
 * sync (unchanged listings are otherwise never re-mapped). "3": approximate zone centres.
 */
export const SCHEMA_VERSION = "3";
/** Overlap between syncs to tolerate clock skew between this machine and Mobilia. */
const CLOCK_SKEW_MS = 5 * 60_000;

/** The subset of Astro's `LoaderContext` the sync needs (structurally compatible). */
export interface SyncRuntime {
  readonly store: {
    set(entry: { id: string; data: Record<string, unknown>; digest?: string }): unknown;
    delete(id: string): void;
    clear(): void;
  };
  readonly meta: {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
  };
  readonly logger: {
    info(message: string): void;
    warn(message: string): void;
  };
  parseData<TData extends Record<string, unknown>>(props: {
    id: string;
    data: TData;
  }): Promise<TData>;
  generateDigest(data: Record<string, unknown> | string): string;
}

export interface SyncOptions {
  readonly now?: () => Date;
}

export interface SyncResult {
  readonly mode: "full" | "incremental";
  readonly upserted: number;
  readonly removed: number;
  readonly skipped: number;
}

function referenceOf(item: unknown): string | undefined {
  if (typeof item !== "object" || item === null || !("referencia" in item)) return undefined;
  const { referencia } = item;
  return typeof referencia === "string" && referencia.trim() !== "" ? referencia : undefined;
}

function toStoreId(reference: string): string {
  return reference.trim().toLowerCase();
}

function validate(items: readonly unknown[], runtime: SyncRuntime) {
  const valid: MobiliaInmueble[] = [];
  let skipped = 0;
  for (const item of items) {
    const parsed = mobiliaInmuebleSchema.safeParse(item);
    if (parsed.success) {
      valid.push(parsed.data);
    } else {
      skipped += 1;
      // Only the reference is logged: never raw payloads (privacy, §5).
      runtime.logger.warn(`Skipping invalid Mobilia inmueble ${referenceOf(item) ?? "(no ref)"}`);
    }
  }
  return { valid, skipped };
}

export async function syncProperties(
  client: MobiliaClient,
  runtime: SyncRuntime,
  options: SyncOptions = {},
): Promise<SyncResult> {
  const startedAt = (options.now ?? (() => new Date()))().toISOString();
  const lastSync = runtime.meta.get(LAST_SYNC_KEY);
  const incremental =
    lastSync !== undefined &&
    !Number.isNaN(Date.parse(lastSync)) &&
    runtime.meta.get(SCHEMA_VERSION_KEY) === SCHEMA_VERSION;

  const rawItems = incremental
    ? await client.listInmuebles({
        modifiedSince: new Date(Date.parse(lastSync) - CLOCK_SKEW_MS).toISOString(),
      })
    : await client.listInmuebles();
  const { valid, skipped } = validate(rawItems, runtime);

  const published: Property[] = valid.filter(isPublishable).map(mapInmueble);
  const unpublishedIds = valid
    .filter((item) => !isPublishable(item))
    .map((item) => toStoreId(item.referencia));

  // Fetch removals before touching the store so any API failure leaves it intact.
  const deactivatedIds = incremental
    ? (await client.listDesactivados())
        .map(referenceOf)
        .filter((ref): ref is string => ref !== undefined)
        .map(toStoreId)
    : [];

  const parsedEntries = await Promise.all(
    published.map(async (property) => ({
      id: property.ref,
      data: await runtime.parseData({ id: property.ref, data: property }),
    })),
  );

  if (!incremental) runtime.store.clear();
  for (const { id, data } of parsedEntries) {
    runtime.store.set({ id, data, digest: runtime.generateDigest(data) });
  }

  const publishedIds = new Set<string>(parsedEntries.map((entry) => entry.id));
  const removals = new Set(
    [...unpublishedIds, ...deactivatedIds].filter((id) => !publishedIds.has(id)),
  );
  let removed = 0;
  for (const id of removals) {
    runtime.store.delete(id);
    removed += 1;
  }

  runtime.meta.set(LAST_SYNC_KEY, startedAt);
  runtime.meta.set(SCHEMA_VERSION_KEY, SCHEMA_VERSION);

  const result: SyncResult = {
    mode: incremental ? "incremental" : "full",
    upserted: parsedEntries.length,
    removed,
    skipped,
  };
  runtime.logger.info(
    `Mobilia ${result.mode} sync: ${result.upserted} upserted, ${result.removed} removed, ${result.skipped} skipped`,
  );
  return result;
}
