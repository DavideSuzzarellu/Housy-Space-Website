import { defineConfig, devices } from "@playwright/test";

// Dedicated port so e2e never reuses a dev/preview server started by someone else.
const PORT = 4329;
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
    url: `http://localhost:${PORT}/es`,
    reuseExistingServer: !isCI,
    timeout: 180_000,
  },
});
