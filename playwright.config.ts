import { defineConfig, devices } from "@playwright/test";

const defaultBaseURL = "http://localhost:3100";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? defaultBaseURL;
const baseUrlPort = (() => {
  try {
    return new URL(baseURL).port || "3000";
  } catch {
    return "3000";
  }
})();
const webServerPort = process.env.PLAYWRIGHT_PORT ?? baseUrlPort;

export default defineConfig({
  // Test directory
  testDir: "./e2e",

  // Run tests in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 1 : 0,

  // Workers
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: [["html", { outputFolder: "playwright-report" }], ["list"]],

  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL,

    // Collect trace when retrying the failed test
    trace: "on-first-retry",

    // Take screenshot on failure
    screenshot: "only-on-failure",

    // Video on failure
    video: "retain-on-failure",

    // Timeout settings
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },

  // Configure projects for major browsers
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    // Minimal approach - only test in Chrome for now
    // Can uncomment these later if needed:
    // {
    //   name: "firefox",
    //   use: { ...devices["Desktop Firefox"] },
    // },
    // {
    //   name: "webkit",
    //   use: { ...devices["Desktop Safari"] },
    // },
  ],

  // Run your local dev server before starting the tests
  webServer: {
    command: `pnpm exec next dev -p ${webServerPort}`,
    url: baseURL,
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
    env: {
      PORT: webServerPort,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? baseURL,
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL ?? baseURL,
      // Default to same-origin and rely on Playwright request routing for determinism.
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? `${baseURL}/api`,
      NEXT_PUBLIC_ALLOW_LOCAL_CONTACT: "true",
      CONTACT_EMAIL: process.env.CONTACT_EMAIL ?? "test@example.com",
    },
  },

  // Timeout settings
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
});
