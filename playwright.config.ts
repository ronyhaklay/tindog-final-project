import { defineConfig, devices } from "@playwright/test";

// E2E tests run against a real app + Supabase (local stack or a test
// project). Start the app first: `npm run dev`, then `npm run e2e`.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // the main flow shares state between steps
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
