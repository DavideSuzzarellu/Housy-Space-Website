# Content sync (Mobilia → Astro content layer)

Properties and agents come from the read-only Mobilia CRM API. They are loaded **at build time** into Astro content collections (`properties`, `agents` in `src/content.config.ts`). The site is static: listings refresh only when the site is rebuilt.

## How a build syncs properties

The loader (`src/features/properties/infrastructure/mobilia/`) runs on every `astro build`, `astro sync` and `astro dev` start.

| Situation                                              | What happens                                                                                                                                                                                                                                                                    |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No previous sync stored (fresh checkout, empty cache)  | **Full sync**: fetch every page of `GET /api/v1/inmuebles` (100 per page), then replace the whole collection.                                                                                                                                                                   |
| A previous sync is stored                              | **Incremental sync**: fetch only properties with `FechaUltimaModificacion` after the last sync (minus a 5-minute overlap for clock skew), upsert them, then delete every reference returned by `GET /api/v1/inmuebles/desactivados` and any listing that came back unpublished. |
| The stored data was written by an older loader version | Full sync (the loader keeps a `schemaVersion` in its meta store).                                                                                                                                                                                                               |
| Mobilia fails (network, 4xx/5xx)                       | The build fails. Nothing is cleared and the last-sync date is not moved, so the next build retries from the same point.                                                                                                                                                         |

Only listings with `publicarEnWeb` and `activo` set are stored. Private fields (private address, owners, keys, documents, cadastral reference) are dropped at the API boundary.

Agents are few, so they are always fully replaced.

The last-sync date lives in the loader's `meta` store, which Astro persists together with the collection data.

## Where Astro keeps the data store

| Command       | File                                                                             |
| ------------- | -------------------------------------------------------------------------------- |
| `astro build` | `<cacheDir>/data-store.json`. `cacheDir` defaults to **`node_modules/.astro/`**. |
| `astro dev`   | `.astro/data-store.json`                                                         |

Without that file, every build is a full sync. That is correct, just slower and heavier on the Mobilia API.

## Caching on CI

Persist **`node_modules/.astro/`** between builds. Restore it before `bun run build` and save it afterwards.

Generic example (GitHub Actions):

```yaml
- uses: actions/cache@v4
  with:
    path: node_modules/.astro
    key: astro-content-${{ github.ref_name }}-${{ github.run_id }}
    restore-keys: astro-content-${{ github.ref_name }}-
```

Notes:

- Restore the cache **after** `bun install`, or make sure install does not delete `node_modules/.astro`.
- The cache holds public listing data only. It never contains credentials: `CLIENT_ID` and `CLIENT_SECRET` come from the CI secret store.
- To force a full sync, drop the cache or delete `node_modules/.astro/data-store.json`.

## Scheduled rebuilds

Hosting is not decided yet (AGENTS.md §2, ROADMAP input I2), so here is the generic setup:

1. Create a **deploy hook** on the hosting provider: a secret URL that starts a production build when it receives a `POST`.
2. Call it on a schedule from a cron job (CI scheduled workflow, the provider's cron feature, or any external scheduler):

   ```bash
   curl -fsS -X POST "$DEPLOY_HOOK_URL"
   ```

3. Store the hook URL as a secret. Never commit it.

**Recommended interval: hourly.** Incremental syncs are cheap (one listing request plus the deactivated list), so hourly keeps the site close to the CRM without hammering it.

### Rate-limit caveat

Mobilia has not published rate limits for the Public API (ROADMAP input I16), and responses carry no rate-limit headers. Until Mobilia confirms the limits:

- Do not schedule builds more often than hourly.
- Keep the CI cache so normal builds stay incremental. A full sync of a large catalog costs one request per 100 listings.
- If listings ever need near real-time freshness, switch `properties` to a live collection (AGENTS.md §3.2). Only the loader changes.

## Local troubleshooting

- `bunx astro sync` runs the loaders without a full build. The log line `Mobilia full|incremental sync: N upserted, N removed, N skipped` shows what happened.
- Invalid items are skipped with a warning naming only their reference. Raw payloads are never logged.
