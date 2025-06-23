import { describe, expect, it } from "vitest";

describe("Environment Setup", () => {
  it("should have all required environment variables set", () => {
    expect(process.env.NODE_ENV).toBe("test");
    expect(process.env.NEXT_PUBLIC_APP_URL).toBe("http://localhost:3000");
    expect(process.env.RESEND_API_KEY).toBe("test-api-key");
    expect(process.env.RESEND_FROM_EMAIL).toBe("test@example.com");
    expect(process.env.CONTACT_EMAIL).toBe("test-contact@example.com");
    expect(process.env.AWS_REGION).toBe("us-east-1");
    expect(process.env.CSRF_SECRET).toBe("test-csrf-secret-for-testing-only-must-be-32-chars");
    expect(process.env.SKIP_ENV_VALIDATION).toBe("true");
  });

  it("should allow importing the env module without validation errors", async () => {
    // Since SKIP_ENV_VALIDATION is true, this should not throw
    expect(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("../../env.mjs");
    }).not.toThrow();
  });

  it("should have proper test environment isolation", () => {
    // Test that we're in test mode
    expect(process.env.NODE_ENV).toBe("test");
    
    // Test that test-specific values are set
    expect(process.env.RESEND_API_KEY).not.toBe(process.env.PROD_RESEND_API_KEY);
    expect(process.env.CONTACT_EMAIL).toContain("test");
  });
});