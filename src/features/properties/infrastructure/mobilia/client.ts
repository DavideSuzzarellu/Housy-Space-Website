import {
  MOBILIA_BASE_URL,
  MOBILIA_MAX_PAGE_SIZE,
  MOBILIA_MAX_PAGES,
  TOKEN_SAFETY_MARGIN_MS,
} from "./config";
import { MobiliaHttpError, MobiliaResponseError } from "./errors";
import { mobiliaPagedSchema, mobiliaTokenSchema } from "./schemas";

/**
 * Read-only Mobilia client (AGENTS.md §5): only `POST /token` and GETs on listings and agents.
 * Never logs or exposes credentials, tokens or response bodies.
 */

type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

export interface MobiliaClientOptions {
  readonly clientId: string;
  readonly clientSecret: string;
  readonly baseUrl?: string;
  readonly fetch?: FetchLike;
  /** Milliseconds clock, injectable for tests. */
  readonly now?: () => number;
}

export interface ListInmueblesOptions {
  /** ISO 8601: only properties modified on the web after this date (incremental sync). */
  readonly modifiedSince?: string;
}

export interface MobiliaClient {
  getAccessToken(): Promise<string>;
  /** Raw, unvalidated items: callers validate each one with Zod. */
  listInmuebles(options?: ListInmueblesOptions): Promise<unknown[]>;
  listDesactivados(): Promise<unknown[]>;
  listAgentes(): Promise<unknown[]>;
}

const TOKEN_ENDPOINT = "/api/v1/token";

export function createMobiliaClient(options: MobiliaClientOptions): MobiliaClient {
  const baseUrl = options.baseUrl ?? MOBILIA_BASE_URL;
  const fetchImpl: FetchLike = options.fetch ?? ((input, init) => fetch(input, init));
  const now = options.now ?? Date.now;

  let cached: { readonly token: string; readonly expiresAt: number } | undefined;
  let inFlight: Promise<string> | undefined;

  async function requestToken(): Promise<string> {
    const response = await fetchImpl(new URL(TOKEN_ENDPOINT, baseUrl), {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: options.clientId,
        client_secret: options.clientSecret,
      }).toString(),
    });
    if (!response.ok) throw new MobiliaHttpError(TOKEN_ENDPOINT, response.status);
    const parsed = mobiliaTokenSchema.safeParse(await response.json());
    if (!parsed.success) throw new MobiliaResponseError(TOKEN_ENDPOINT);
    cached = {
      token: parsed.data.access_token,
      expiresAt: now() + parsed.data.expires_in * 1000 - TOKEN_SAFETY_MARGIN_MS,
    };
    return cached.token;
  }

  async function getAccessToken(): Promise<string> {
    if (cached !== undefined && now() < cached.expiresAt) return cached.token;
    // Tokens are not refreshable (§5): request a new one, sharing a single in-flight request.
    inFlight ??= requestToken().finally(() => {
      inFlight = undefined;
    });
    return inFlight;
  }

  async function getJson(endpoint: string, params: Readonly<Record<string, string>>) {
    const url = new URL(endpoint, baseUrl);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

    const send = async () =>
      fetchImpl(url, {
        headers: { authorization: `Bearer ${await getAccessToken()}`, accept: "application/json" },
      });

    let response = await send();
    if (response.status === 401) {
      cached = undefined; // Token revoked or expired early: renew once.
      response = await send();
    }
    if (!response.ok) throw new MobiliaHttpError(endpoint, response.status);
    const body: unknown = await response.json();
    return body;
  }

  async function fetchAllPages(
    endpoint: string,
    params: Readonly<Record<string, string>> = {},
  ): Promise<unknown[]> {
    const items: unknown[] = [];
    for (let page = 1; page <= MOBILIA_MAX_PAGES; page += 1) {
      const parsed = mobiliaPagedSchema.safeParse(
        await getJson(endpoint, {
          ...params,
          NumeroPagina: String(page),
          TamanoPagina: String(MOBILIA_MAX_PAGE_SIZE),
        }),
      );
      if (!parsed.success) throw new MobiliaResponseError(endpoint);
      const pageItems = parsed.data.elementos ?? [];
      items.push(...pageItems);
      if (pageItems.length === 0 || items.length >= parsed.data.totalElementos) return items;
    }
    return items;
  }

  return {
    getAccessToken,
    listInmuebles: (listOptions = {}) =>
      fetchAllPages(
        "/api/v1/inmuebles",
        listOptions.modifiedSince === undefined
          ? {}
          : { FechaUltimaModificacion: listOptions.modifiedSince },
      ),
    listDesactivados: () => fetchAllPages("/api/v1/inmuebles/desactivados"),
    listAgentes: () => fetchAllPages("/api/v1/agentes"),
  };
}
