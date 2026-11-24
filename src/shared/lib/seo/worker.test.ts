import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import worker from "../../../../worker";
import { PRODUCTION_ORIGIN } from "./indexability";

const canonical = new URL(PRODUCTION_ORIGIN);
const otherProductionHost = canonical.hostname.startsWith("www.")
  ? canonical.hostname.slice(4)
  : `www.${canonical.hostname}`;

const env = (asset: Response = new Response("<html></html>")) => ({
  ASSETS: { fetch: () => Promise.resolve(asset) },
});
const call = (url: string, asset?: Response) => worker.fetch(new Request(url), env(asset));

describe("worker.js", () => {
  it("reads the canonical origin from deploy.config.json, the same file as the site", () => {
    const config: unknown = JSON.parse(readFileSync("deploy.config.json", "utf8"));
    expect(config).toEqual({ productionOrigin: PRODUCTION_ORIGIN });
    expect(readFileSync("worker.js", "utf8")).not.toMatch(/housyspace\.com/);
  });

  it("serves the canonical host untouched", async () => {
    const res = await call(`${PRODUCTION_ORIGIN}/es`);
    expect(res.status).toBe(200);
    expect(res.headers.get("X-Robots-Tag")).toBeNull();
  });

  it("301s the other production host to the canonical origin, keeping path and query", async () => {
    const res = await call(`https://${otherProductionHost}/es/venta?zona=gracia`);
    expect(res.status).toBe(301);
    expect(res.headers.get("Location")).toBe(`${PRODUCTION_ORIGIN}/es/venta?zona=gracia`);
  });

  it("keeps a _redirects 301 (absolute destination) as the single hop", async () => {
    const rule = new Response(null, {
      status: 301,
      headers: { Location: `${PRODUCTION_ORIGIN}/es/servicios` },
    });
    const res = await call(`https://${otherProductionHost}/servicios`, rule);
    expect(res.headers.get("Location")).toBe(`${PRODUCTION_ORIGIN}/es/servicios`);
  });

  it("marks every other host (previews, workers.dev) noindex,nofollow and never redirects it", async () => {
    const res = await call("https://housyspace-web.example.workers.dev/es");
    expect(res.status).toBe(200);
    expect(res.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
  });
});
