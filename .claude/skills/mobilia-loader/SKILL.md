---
name: mobilia-loader
description: "Trigger: Mobilia, inmuebles, agentes, content loader, properties collection, fixtures. Build or change the read-only Mobilia CRM loaders, Zod mapping and tests."
when_to_use: "Any change to src/content.config.ts collections backed by Mobilia, features/properties/infrastructure, Mobilia Zod schemas, mappers, or recorded fixtures."
metadata:
  author: "housyspace"
  version: "1.0"
---

# Mobilia loader

## Activation Contract

Load before touching `mobiliaPropertiesLoader()`, the `agents` loader, Mobilia schemas/mappers, the `Property` domain mapping, or Mobilia fixtures. Also load `testing-tdd`.

## Hard Rules

- Read-only: only `POST /api/v1/token` and `GET` on `/api/v1/inmuebles`, `/api/v1/inmuebles/desactivados`, `/api/v1/agentes` (AGENTS.md §5). Never call write endpoints.
- Mobilia code lives ONLY in `src/features/properties/infrastructure/` (agents loader may live in `features/agency/infrastructure/`). Pages/UI never import it and never see Mobilia field names (§3).
- Secrets: `CLIENT_ID` / `CLIENT_SECRET` via `astro:env/server`, declared with `envField.string({ context: "server", access: "secret" })`. Never read `.env`, never log or print values, tokens, or raw responses containing them.
- Privacy (§5): never map `direccionPrivada`, owners, keys, documents (`archivos`). If `mostrarDireccionExacta !== true`, drop `latitud`/`longitud`/exact address and expose only `latitudZona`/`longitudZona`/`radioZona`.
- Only entries with `publicarEnWeb === true && activo === true` reach `store.set()`.
- Entry id = `referencia` lowercased (it is the only lookup key, §4.1).
- Most spec fields are `nullable: true`: Zod must accept `null` and normalize to domain defaults; never `any`.
- Never invent field values; missing data stays absent in the domain.

## Decision Gates

| Situation | Action |
|-----------|--------|
| Token missing or expired | `POST /api/v1/token` (form-urlencoded `grant_type=client_credentials`, `client_id`, `client_secret`); cache `access_token` in module memory until `expires_in` minus a safety margin. No refresh token exists: request a new one. |
| `meta.get("lastSync")` empty | Full sync: page all `inmuebles`, `store.clear()` first. |
| `lastSync` present | Incremental: pass `FechaUltimaModificacion=<ISO 8601>` (filters by web-modification date), upsert changed entries, then delete every ref from `/inmuebles/desactivados` with `store.delete(id)`. |
| Mobilia HTTP error | Throw a typed infrastructure error with status only (no body, no secrets); build fails loudly. |
| Field needed by UI not in domain | Add it to the domain `Property` type + mapper + fixture test; never pass raw Mobilia objects through. |

## Execution Steps

1. Check the field in the Mobilia spec (URL in AGENTS.md §5; save it outside the repo and inspect with `python3 -I`, never execute it); Inmueble titles are nested: `tituloWeb.txtTituloWeb` (es), `txtTituloWebEn`, `txtTituloWebIt`, `txtTituloWebCa`; descriptions `descripcionWeb.txtDescripcionWeb{,En,It,Ca}`; photos `fotos[]` (`url`, `descripcion{,En,It,Ca}`, `orden`, `destacada`).
2. Write the failing Vitest test first against a sanitized fixture (step 7).
3. Auth client: one function `getAccessToken()` with in-memory cache; send `Authorization: Bearer <token>`.
4. Pager: request `NumeroPagina` from 1 with `TamanoPagina` ≤ 100 (spec max); response shape `{ elementos, totalElementos, pagina, tamanoPagina }`; stop when fetched count ≥ `totalElementos` or page is empty.
5. Mapping: a Mobilia Zod schema validates the raw item and `.transform()`s to domain `Property` with `{ es, en, it, ca }` localized fields. Fallback for display is requested locale → `es` → `en` (§4), applied in the domain/application layer, not by copying text in the loader.
6. Loader object: `{ name, load, schema } satisfies Loader` (`import type { Loader } from "astro/loaders"`, `import { z } from "astro/zod"`). In `load({ store, meta, parseData, generateDigest, logger })`: `const data = await parseData({ id, data: mapped })`, `store.set({ id, data, digest: generateDigest(data) })`, then `meta.set("lastSync", startedAtIso)` only after success.
7. Fixtures: record real responses once into `tests/fixtures/mobilia/`, then strip tokens, owner/contact data, `direccionPrivada`, `archivos`, personal names/emails/phones, and exact coordinates of hidden-address listings. Review the diff before committing.
8. Tests (Vitest, `fetch` mocked with fixtures): token cache reuse and expiry, paging stop condition, `publicarEnWeb/activo` filter, incremental call includes `FechaUltimaModificacion`, desactivados deletion, privacy (no `direccionPrivada`, approximate coords), null handling, locale mapping, `referencia` lowercased.
9. Run `bun run test`, `bun run check`.

## Output Contract

Return: files changed, domain fields added/removed, privacy checks covered by tests, fixture sanitization confirmation, and test/check results.

## References

- `../../../AGENTS.md` §3, §3.2, §4, §4.1, §5, §8
- Mobilia spec (AGENTS.md §5): it declares no `servers` base URL — keep the base URL in one infrastructure constant and confirm it with the user
- Skill `testing-tdd`
