import { describe, expect, it, vi } from "vitest";
import { createMobiliaClient } from "./client";
import { MobiliaHttpError } from "./errors";

interface Call {
  readonly url: URL;
  readonly init: RequestInit | undefined;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/** Fake fetch: routes token and listing requests; records every call. */
function fakeMobilia(options: {
  readonly pages?: readonly (readonly unknown[])[];
  readonly total?: number;
  readonly expiresIn?: number;
  readonly listingStatus?: readonly number[];
}) {
  const calls: Call[] = [];
  let tokenCount = 0;
  const statuses = [...(options.listingStatus ?? [])];
  const fetchImpl = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(input instanceof Request ? input.url : input.toString());
    calls.push({ url, init });
    if (url.pathname === "/api/v1/token") {
      tokenCount += 1;
      return json({
        access_token: `token-${tokenCount}`,
        token_type: "Bearer",
        expires_in: options.expiresIn ?? 7200,
      });
    }
    const status = statuses.shift() ?? 200;
    if (status !== 200) return json({ detail: "secret internals" }, status);
    const pages = options.pages ?? [[]];
    const page = Number(url.searchParams.get("NumeroPagina"));
    const elementos = pages[page - 1] ?? [];
    const total = options.total ?? pages.reduce((sum, items) => sum + items.length, 0);
    return json({ elementos, totalElementos: total, pagina: page, tamanoPagina: 100 });
  });
  return {
    calls,
    fetchImpl,
    tokenRequests: () => calls.filter((c) => c.url.pathname === "/api/v1/token"),
  };
}

function client(fake: ReturnType<typeof fakeMobilia>, now: () => number = () => 0) {
  return createMobiliaClient({
    clientId: "id-value",
    clientSecret: "secret-value",
    fetch: fake.fetchImpl,
    now,
  });
}

describe("Mobilia token", () => {
  it("requests a client_credentials token with a form-encoded body", async () => {
    const fake = fakeMobilia({});
    await client(fake).getAccessToken();
    const [request] = fake.tokenRequests();
    expect(request?.init?.method).toBe("POST");
    const body = new URLSearchParams(String(request?.init?.body));
    expect(body.get("grant_type")).toBe("client_credentials");
    expect(body.get("client_id")).toBe("id-value");
    expect(body.get("client_secret")).toBe("secret-value");
  });

  it("reuses the cached token until it is about to expire", async () => {
    let time = 0;
    const fake = fakeMobilia({ expiresIn: 3600 });
    const mobilia = client(fake, () => time);
    expect(await mobilia.getAccessToken()).toBe("token-1");
    time = 3_000_000; // 50 min: still valid
    expect(await mobilia.getAccessToken()).toBe("token-1");
    time = 3_560_000; // inside the 60 s safety margin
    expect(await mobilia.getAccessToken()).toBe("token-2");
    expect(fake.tokenRequests()).toHaveLength(2);
  });

  it("sends the bearer token on listing requests", async () => {
    const fake = fakeMobilia({});
    await client(fake).listInmuebles();
    const listing = fake.calls.find((c) => c.url.pathname === "/api/v1/inmuebles");
    expect(new Headers(listing?.init?.headers).get("authorization")).toBe("Bearer token-1");
  });

  it("renews the token once when the API answers 401", async () => {
    const fake = fakeMobilia({ listingStatus: [401], pages: [[{ referencia: "1" }]] });
    expect(await client(fake).listInmuebles()).toHaveLength(1);
    expect(fake.tokenRequests()).toHaveLength(2);
  });
});

describe("Mobilia pagination", () => {
  it("pages with the maximum page size until totalElementos is reached", async () => {
    const fake = fakeMobilia({ pages: [[{ a: 1 }, { a: 2 }], [{ a: 3 }]], total: 3 });
    const items = await client(fake).listInmuebles();
    expect(items).toHaveLength(3);
    const listings = fake.calls.filter((c) => c.url.pathname === "/api/v1/inmuebles");
    expect(listings.map((c) => c.url.searchParams.get("NumeroPagina"))).toEqual(["1", "2"]);
    expect(listings.every((c) => c.url.searchParams.get("TamanoPagina") === "100")).toBe(true);
  });

  it("stops on an empty page even if totalElementos is larger", async () => {
    const fake = fakeMobilia({ pages: [[{ a: 1 }], []], total: 50 });
    expect(await client(fake).listInmuebles()).toHaveLength(1);
  });

  it("passes the modification-date filter for incremental syncs", async () => {
    const fake = fakeMobilia({});
    await client(fake).listInmuebles({ modifiedSince: "2026-10-20T10:00:00.000Z" });
    const listing = fake.calls.find((c) => c.url.pathname === "/api/v1/inmuebles");
    expect(listing?.url.searchParams.get("FechaUltimaModificacion")).toBe(
      "2026-10-20T10:00:00.000Z",
    );
  });

  it("lists deactivated properties and agents from their endpoints", async () => {
    const fake = fakeMobilia({});
    const mobilia = client(fake);
    await mobilia.listDesactivados();
    await mobilia.listAgentes();
    const paths = fake.calls.map((c) => c.url.pathname);
    expect(paths).toContain("/api/v1/inmuebles/desactivados");
    expect(paths).toContain("/api/v1/agentes");
  });
});

describe("Mobilia errors", () => {
  it("throws a typed error with the status and no response body", async () => {
    const fake = fakeMobilia({ listingStatus: [500] });
    const error = await client(fake)
      .listInmuebles()
      .catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(MobiliaHttpError);
    expect(error).toMatchObject({ status: 500, endpoint: "/api/v1/inmuebles" });
    expect(String(error)).not.toContain("secret internals");
    expect(String(error)).not.toContain("secret-value");
  });

  it("never sends credentials anywhere except the token endpoint", async () => {
    const fake = fakeMobilia({});
    await client(fake).listInmuebles();
    for (const call of fake.calls.filter((c) => c.url.pathname !== "/api/v1/token")) {
      expect(call.url.href).not.toContain("secret-value");
      expect(JSON.stringify(call.init ?? {})).not.toContain("secret-value");
    }
  });
});
