/* @vitest-environment node */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("getResendClient", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("throws when RESEND_API_KEY is not set", async () => {
    // RESEND_API_KEY is optional in env.mjs, so leave it undefined (not empty string)
    // The function should still throw when apiKey is undefined
    vi.stubEnv("SKIP_ENV_VALIDATION", "1");
    vi.stubEnv("RESEND_API_KEY", "");

    const { getResendClient } = await import("@/lib/email/resend-client");
    expect(() => getResendClient()).toThrow("RESEND_API_KEY environment variable is required");
  });

  it("returns Resend instance when API key is set", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_12345");

    const { getResendClient } = await import("@/lib/email/resend-client");
    const client = getResendClient();

    expect(client).toBeDefined();
    expect(client.emails).toBeDefined();
  });

  it("returns same instance on subsequent calls (singleton)", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_12345");

    const { getResendClient } = await import("@/lib/email/resend-client");
    const client1 = getResendClient();
    const client2 = getResendClient();

    expect(client1).toBe(client2);
  });
});
