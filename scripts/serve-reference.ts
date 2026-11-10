/**
 * Serves the client's static reference site so pages can be compared in a browser.
 * Usage: bun scripts/serve-reference.ts <path-to-housyspace-web-ref> [port=4500]
 */
import { existsSync, statSync } from "node:fs";
import { join, normalize } from "node:path";

const root = process.argv[2];
const port = Number(process.argv[3] ?? 4500);
if (root === undefined) throw new Error("Usage: bun scripts/serve-reference.ts <dir> [port]");

Bun.serve({
  port,
  fetch(req) {
    const relative = normalize(decodeURIComponent(new URL(req.url).pathname)).replace(/^[/\\]+/, "");
    if (relative.includes("..")) return new Response("forbidden", { status: 403 });
    let file = join(root, relative);
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
    return existsSync(file) ? new Response(Bun.file(file)) : new Response("not found", { status: 404 });
  },
});
console.log(`reference on http://localhost:${port}`);
