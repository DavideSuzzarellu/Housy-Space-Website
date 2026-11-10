/**
 * Serves the client's static reference site so pages can be compared in a browser.
 * Usage: bun scripts/serve-reference.ts <path-to-housyspace-web-ref> [port=4500]
 */
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const root = process.argv[2];
const port = Number(process.argv[3] ?? 4500);
if (root === undefined) throw new Error("Usage: bun scripts/serve-reference.ts <dir> [port]");

const TYPES: Readonly<Record<string, string>> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

createServer((req, res) => {
  const path = new URL(req.url ?? "/", "http://localhost").pathname;
  const relative = normalize(decodeURIComponent(path)).replace(/^[/\\]+/, "");
  if (relative.includes("..")) {
    res.writeHead(403).end("forbidden");
    return;
  }
  let file = join(root, relative);
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
  if (!existsSync(file)) {
    res.writeHead(404).end("not found");
    return;
  }
  res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
  createReadStream(file).pipe(res);
}).listen(port, () => console.log(`reference on http://localhost:${port}`));
