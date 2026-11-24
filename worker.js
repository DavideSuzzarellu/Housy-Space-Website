/* HousySpace · entry point for Cloudflare Workers (static assets from ./dist, see wrangler.jsonc).
 *  1. Non-canonical host of the production domain (www <-> apex) -> 301 to the canonical origin,
 *     same path and query. The canonical origin is the one constant `productionOrigin` of
 *     deploy.config.json, the same file the site reads (PRODUCTION_ORIGIN): never hardcode it here.
 *  2. Any other host (workers.dev previews, branch deploys) answers with `X-Robots-Tag: noindex,
 *     nofollow`, so Google never indexes a test copy even if its pages say "index".
 * Images, CSS and JS skip this file (`run_worker_first` in wrangler.jsonc). No form handler lives here. */
import deploy from "./deploy.config.json";

const canonical = new URL(deploy.productionOrigin);
const bareHost = canonical.hostname.replace(/^www\./, "");
const productionHosts = new Set([bareHost, `www.${bareHost}`]);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const response = await env.ASSETS.fetch(request);
    if (url.hostname === canonical.hostname) return response;
    if (productionHosts.has(url.hostname)) {
      // A `_redirects` rule already answers 301 with an absolute destination: one hop, keep it.
      if (response.status === 301) return response;
      return Response.redirect(`${canonical.origin}${url.pathname}${url.search}`, 301);
    }
    const preview = new Response(response.body, response);
    preview.headers.set("X-Robots-Tag", "noindex, nofollow");
    return preview;
  },
};
