import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

const defaultEnv: Record<string, string> = {
  AWS_REGION: "us-east-1",
  AWS_ACCESS_KEY_ID: "test-access-key",
  AWS_SECRET_ACCESS_KEY: "test-secret",
  CONTACT_EMAIL: "test@example.com",
  NEXT_PUBLIC_APP_URL: "example.com",
};

/**
 * Configure the global test environment prior to each spec.
 */
Object.entries(defaultEnv).forEach(([key, value]) => {
  process.env[key] = value;
});

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

beforeEach(() => {
  Object.entries(defaultEnv).forEach(([key, value]) => {
    process.env[key] = value;
  });
});

/**
 * Ensure isolation by clearing mocks and DOM state between specs.
 */
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.resetAllMocks();
});
