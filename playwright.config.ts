import { defineConfig, devices } from "@playwright/test";

const defaultBaseURL = "http://localhost:3100";
const rawBaseURL = process.env.PLAYWRIGHT_BASE_URL ?? defaultBaseURL;

const parsedBaseURL = (() => {
  try {
    return new URL(rawBaseURL);
  } catch {
    return null;
  }
})();

const webServerHostname = parsedBaseURL?.hostname ?? "localhost";
const webServerProtocol = parsedBaseURL?.protocol ?? "http:";
const parsedBasePort = parsedBaseURL?.port || "";
const isLocalHost = ["localhost", "127.0.0.1", "::1"].includes(webServerHostname);
const serverMode = (() => {
  if (!isLocalHost) return "none";
  const rawMode = process.env.PLAYWRIGHT_SERVER_MODE?.toLowerCase();
  if (!rawMode) return process.env.CI ? "static" : "dev";
  if (rawMode === "dev" || rawMode === "static" || rawMode === "none") return rawMode;
  throw new Error(`Invalid PLAYWRIGHT_SERVER_MODE: ${process.env.PLAYWRIGHT_SERVER_MODE}`);
})();
const useDevServer = serverMode === "dev";
const useStaticServer = serverMode === "static";
const shouldStartServer = useDevServer || useStaticServer;
const webServerPort = isLocalHost
  ? (process.env.PLAYWRIGHT_PORT ?? (parsedBasePort || "3100"))
  : parsedBasePort;
const workerCount = (() => {
  const rawWorkers = process.env.PLAYWRIGHT_WORKERS;
  if (rawWorkers) {
    const numeric = Number(rawWorkers);
    return Number.isNaN(numeric) ? rawWorkers : numeric;
  }
  if (useDevServer) return 1;
  if (process.env.CI) return "50%";
  return undefined;
})();
const captureArtifacts =
  process.env.PLAYWRIGHT_DEBUG_ARTIFACTS === "true" || Boolean(process.env.CI);

const baseURL = (() => {
  const portSuffix = webServerPort ? `:${webServerPort}` : "";
  return `${webServerProtocol}//${webServerHostname}${portSuffix}`;
})();

const readyURL = new URL("/", baseURL).toString();
const apiURL = new URL("/api", baseURL).toString();

const webServerCommand = (() => {
  if (useStaticServer) {
    const base = `bun scripts/serve-static-out.mjs --dir out --port ${webServerPort} --host ${webServerHostname} --quiet`;
    return process.platform === "win32" ? base : `env -u NO_COLOR ${base}`;
  }

  const base = `bun run dev -- --webpack -p ${webServerPort} -H ${webServerHostname}`;
  // The Codex/CI environment can set NO_COLOR=1 globally, while Playwright sets FORCE_COLOR.
  // Bun prints a noisy warning+stack trace when both exist. Unset NO_COLOR for the webServer command.
  return process.platform === "win32" ? base : `env -u NO_COLOR ${base}`;
})();

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
  workers: workerCount,

  // Reporter to use
  reporter: [["html", { outputFolder: "playwright-report" }], ["list"]],

  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL,

    // Collect trace when retrying the failed test
    trace: captureArtifacts ? "on-first-retry" : "off",

    // Take screenshot on failure
    screenshot: "only-on-failure",

    // Video on failure
    video: captureArtifacts ? "retain-on-failure" : "off",

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
  webServer: shouldStartServer
    ? {
        command: webServerCommand,
        url: readyURL,
        timeout: 120 * 1000,
        reuseExistingServer: !process.env.CI,
        stdout: "ignore",
        stderr: "pipe",
        env: {
          SKIP_ENV_VALIDATION: "true",
          ...(useDevServer
            ? {
                SKIP_IMAGE_VARIANTS:
                  process.env.PLAYWRIGHT_SKIP_IMAGE_VARIANTS ??
                  process.env.SKIP_IMAGE_VARIANTS ??
                  "true",
              }
            : {}),
          PORT: webServerPort,
          NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? baseURL,
          NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL ?? baseURL,
          // Default to same-origin and rely on Playwright request routing for determinism.
          NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? apiURL,
          NEXT_PUBLIC_ALLOW_LOCAL_CONTACT: "true",
          CONTACT_EMAIL: process.env.CONTACT_EMAIL ?? "test@example.com",
        },
      }
    : undefined,

  // Timeout settings
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
});
