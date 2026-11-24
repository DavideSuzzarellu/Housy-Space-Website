/** Types of `worker.js` (plain JS for Cloudflare), so the Vitest suite can import it. */
declare const worker: {
  fetch(
    request: Request,
    env: { ASSETS: { fetch(request: Request): Promise<Response> } },
  ): Promise<Response>;
};
export default worker;
