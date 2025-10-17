import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

const defaultEnv = {
  AWS_REGION: "us-east-1",
  AWS_ACCESS_KEY_ID: "test-access-key",
  AWS_SECRET_ACCESS_KEY: "test-secret",
  CONTACT_EMAIL: "test@example.com",
  NEXT_PUBLIC_APP_URL: "example.com",
};

/**
 * Configure the global test environment prior to each spec.
 */
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
