/* @vitest-environment node */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const stubValidPublicUrls = () => {
  vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example.com");
  vi.stubEnv("NEXT_PUBLIC_BASE_URL", "https://example.com");
};

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
    stubValidPublicUrls();

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
    stubValidPublicUrls();

    const { env } = await import("@/env.mjs");

    expect(env.CONTACT_EMAIL).toBe("valid@example.com");
  });

  it("requires NEXT_PUBLIC_APP_URL", async () => {
    vi.stubEnv("SKIP_ENV_VALIDATION", "");
    vi.stubEnv("CONTACT_EMAIL", "test@example.com");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    stubValidPublicUrls();

    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      await expect(import("@/env.mjs")).rejects.toThrow("Invalid environment variables");
    } finally {
      consoleError.mockRestore();
    }
  });

  it("requires NEXT_PUBLIC_API_URL as a valid URL", async () => {
    vi.stubEnv("SKIP_ENV_VALIDATION", "");
    vi.stubEnv("CONTACT_EMAIL", "test@example.com");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "example.com");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "not-a-url");
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "https://example.com");

    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      await expect(import("@/env.mjs")).rejects.toThrow("Invalid environment variables");
    } finally {
      consoleError.mockRestore();
    }
  });

  it("requires NEXT_PUBLIC_BASE_URL as a valid URL", async () => {
    vi.stubEnv("SKIP_ENV_VALIDATION", "");
    vi.stubEnv("CONTACT_EMAIL", "test@example.com");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "example.com");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example.com");
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "not-a-url");

    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      await expect(import("@/env.mjs")).rejects.toThrow("Invalid environment variables");
    } finally {
      consoleError.mockRestore();
    }
  });

  it("accepts valid NEXT_PUBLIC_API_URL", async () => {
    const publicApiUrl = "https://api.example.com";
    vi.stubEnv("SKIP_ENV_VALIDATION", "");
    vi.stubEnv("CONTACT_EMAIL", "test@example.com");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "example.com");
    vi.stubEnv("NEXT_PUBLIC_API_URL", publicApiUrl);
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "https://example.com");

    const { env } = await import("@/env.mjs");

    expect(env.NEXT_PUBLIC_API_URL).toBe(publicApiUrl);
  });

  it("accepts valid NEXT_PUBLIC_BASE_URL", async () => {
    const publicBaseUrl = "https://example.com";
    vi.stubEnv("SKIP_ENV_VALIDATION", "");
    vi.stubEnv("CONTACT_EMAIL", "test@example.com");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "example.com");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example.com");
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", publicBaseUrl);

    const { env } = await import("@/env.mjs");

    expect(env.NEXT_PUBLIC_BASE_URL).toBe(publicBaseUrl);
  });

  it("accepts optional server variables when not set in env", async () => {
    vi.stubEnv("SKIP_ENV_VALIDATION", "");
    vi.stubEnv("CONTACT_EMAIL", "test@example.com");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "example.com");
    stubValidPublicUrls();
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
