import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3199",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "bun run dev --port 3199",
    url: `${process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3199"}/asystent`,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
