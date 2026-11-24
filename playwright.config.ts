import { readFileSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// The production origin the specs assert comes from the same file as the site and the worker.
const { productionOrigin } = JSON.parse(readFileSync("./deploy.config.json", "utf8")) as {
  productionOrigin: string;
};

// Port is overridable (E2E_PORT) so parallel worktrees never share one. A server already on it is
// NOT reused unless E2E_REUSE_SERVER=1: reusing someone else's stale build silently tests old code.
const PORT = Number(process.env["E2E_PORT"] ?? 4329);
// One variable builds the site and tells the specs its base; "/" is the site root.
const ASTRO_BASE = process.env["ASTRO_BASE"] ?? "/";
process.env["ASTRO_BASE"] = ASTRO_BASE;
const isCI = Boolean(process.env["CI"]);

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: isCI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    {
      name: "chromium-reduced-motion",
      use: { ...devices["Desktop Chrome"], contextOptions: { reducedMotion: "reduce" } },
    },
  ],
  // Tests run against the production build served by `astro preview`.
  webServer: {
    command: `bun run build && bun run preview --port ${PORT} --ignore-lock`,
    // The preview serves only under the build base (ASTRO_BASE, "/" = root): wait on a real page.
    url: `http://localhost:${PORT}${ASTRO_BASE.replace(/\/$/, "")}/es`,
    reuseExistingServer: process.env["E2E_REUSE_SERVER"] === "1",
    // Production deploys under a repository sub-path; tests use the site root.
    env: { ASTRO_BASE, ASTRO_SITE: productionOrigin },
    timeout: 300_000,
  },
});
