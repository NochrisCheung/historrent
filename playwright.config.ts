import { defineConfig, devices } from "@playwright/test";

// Historrent's dev server runs on 3001 (3000 may be occupied by another project on
// the maintainer's machine; CI is single-tenant but we keep the same port for parity).
const PORT = 3001;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      // Suppress the dev-only Leva curve-tuner so it doesn't intercept
      // clicks on top-right UI (language toggle, detail panel close button).
      NEXT_PUBLIC_DISABLE_DEV_TUNER: "1",
    },
  },
});
