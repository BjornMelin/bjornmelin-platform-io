import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, beforeEach, vi } from "vitest";
import { server } from "@/mocks/node";
import { applyDefaultTestEnv } from "./setup-env";

/**
 * Configure the global test environment prior to each spec.
 */
applyDefaultTestEnv();

// Provide a jsdom-safe matchMedia for libraries relying on it (e.g., next-themes)
if (typeof window !== "undefined" && !("matchMedia" in window)) {
  // @ts-expect-error augment test environment
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

/**
 * Start MSW server before all tests
 * Use 'error' to catch any missing handlers
 */
beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

beforeEach(() => {
  applyDefaultTestEnv();
});

/**
 * Ensure isolation by clearing mocks, MSW handlers, and DOM state between specs.
 */
afterEach(() => {
  vi.unstubAllEnvs();
  cleanup();
  server.resetHandlers();
  vi.clearAllMocks();
  vi.resetAllMocks();
});

/**
 * Clean up MSW server after all tests
 */
afterAll(() => {
  server.close();
});
