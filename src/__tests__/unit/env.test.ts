/* @vitest-environment node */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("env validation", () => {
  beforeEach(() => {
    // Reset modules to force fresh env validation on each test
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("validates required CONTACT_EMAIL as email format", async () => {
    vi.stubEnv("SKIP_ENV_VALIDATION", "");
    vi.stubEnv("CONTACT_EMAIL", "invalid-email");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "example.com");

    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      await expect(import("@/env.mjs")).rejects.toThrow("Invalid environment variables");
    } finally {
      consoleError.mockRestore();
    }
  });

  it("accepts valid CONTACT_EMAIL", async () => {
    vi.stubEnv("SKIP_ENV_VALIDATION", "");
    vi.stubEnv("CONTACT_EMAIL", "valid@example.com");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "example.com");

    const { env } = await import("@/env.mjs");

    expect(env.CONTACT_EMAIL).toBe("valid@example.com");
  });

  it("requires NEXT_PUBLIC_APP_URL", async () => {
    vi.stubEnv("SKIP_ENV_VALIDATION", "");
    vi.stubEnv("CONTACT_EMAIL", "test@example.com");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");

    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      await expect(import("@/env.mjs")).rejects.toThrow("Invalid environment variables");
    } finally {
      consoleError.mockRestore();
    }
  });

  it("accepts optional server variables when not set in env", async () => {
    vi.stubEnv("SKIP_ENV_VALIDATION", "");
    vi.stubEnv("CONTACT_EMAIL", "test@example.com");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "example.com");
    // Don't set AWS_REGION and RESEND_API_KEY - they should be undefined
    // Note: In t3-env, an empty string "" triggers validation, but truly unset vars are undefined

    const { env } = await import("@/env.mjs");

    // Required fields should be present
    expect(env.CONTACT_EMAIL).toBe("test@example.com");
    expect(env.NEXT_PUBLIC_APP_URL).toBe("example.com");
  });

  it("skips validation when SKIP_ENV_VALIDATION is set", async () => {
    vi.stubEnv("SKIP_ENV_VALIDATION", "true");
    vi.stubEnv("CONTACT_EMAIL", ""); // Invalid but should be skipped
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");

    // Should not throw because validation is skipped
    const module = await import("@/env.mjs");
    expect(module).toBeDefined();
  });
});
