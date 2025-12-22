/* @vitest-environment node */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetRateLimit } from "@/lib/security/rate-limiter";
import { buildContactFormWithSecurity } from "@/test/factories/contact";

// Mock the email module at the top level (hoisted)
const mockSendContactEmail = vi.fn();
vi.mock("@/lib/email", () => ({
  sendContactEmail: mockSendContactEmail,
}));

describe("POST /api/contact (integration)", () => {
  const testIp = "127.0.0.1";

  beforeEach(() => {
    // Reset mock before each test
    mockSendContactEmail.mockReset();
    mockSendContactEmail.mockResolvedValue(undefined);

    vi.stubEnv("CONTACT_EMAIL", "recipient@example.com");
    vi.stubEnv("EMAIL_FROM", "Contact Form <noreply@example.com>");

    // Reset rate limit state for test IPs
    resetRateLimit(testIp);
    resetRateLimit("unknown");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    resetRateLimit(testIp);
    resetRateLimit("unknown");
    resetRateLimit("192.168.1.100");
    resetRateLimit("192.168.1.200");
  });

  /**
   * Helper to create a contact request with standard headers.
   */
  function createContactRequest(body: Record<string, unknown>, ip: string = testIp): Request {
    return new Request("http://localhost/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": ip,
      },
      body: JSON.stringify(body),
    });
  }

  it("returns 200 on valid payload when email sends successfully", async () => {
    const { POST } = await import("@/app/api/contact/route");

    const req = createContactRequest(buildContactFormWithSecurity());
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockSendContactEmail).toHaveBeenCalledOnce();
  });

  it("returns 429 when rate limit exceeded", async () => {
    const { POST } = await import("@/app/api/contact/route");

    // Make 5 successful requests
    for (let i = 0; i < 5; i++) {
      const req = createContactRequest(buildContactFormWithSecurity());
      await POST(req);
    }

    // 6th request should be rate limited
    const req = createContactRequest(buildContactFormWithSecurity());
    const res = await POST(req);

    expect(res.status).toBe(429);
    const data = (await res.json()) as { error: string };
    expect(data.error).toContain("Too many requests");
  });

  it("returns 400 when honeypot field is filled (schema validation rejects non-empty)", async () => {
    const { POST } = await import("@/app/api/contact/route");

    const req = createContactRequest(buildContactFormWithSecurity({ honeypot: "I am a bot" }));
    const res = await POST(req);

    // Schema validation rejects non-empty honeypot
    expect(res.status).toBe(400);
    const data = (await res.json()) as { code: string };
    expect(data.code).toBe("VALIDATION_ERROR");
  });

  it("does NOT send email when honeypot field is filled", async () => {
    const { POST } = await import("@/app/api/contact/route");

    const req = createContactRequest(buildContactFormWithSecurity({ honeypot: "spam content" }));
    const res = await POST(req);

    // Email should NOT be sent - validation fails before email sending
    expect(res.status).toBe(400);
    expect(mockSendContactEmail).not.toHaveBeenCalled();
  });

  it("returns 400 when submission too fast", async () => {
    const { POST } = await import("@/app/api/contact/route");

    // Form load time is current time (submission is instant = too fast)
    const req = createContactRequest(buildContactFormWithSecurity({ formLoadTime: Date.now() }));
    const res = await POST(req);

    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string };
    expect(data.error).toContain("take your time");
  });

  it("throws at module load when CONTACT_EMAIL not configured", async () => {
    // Ensure validation is enforced even in CI where SKIP_ENV_VALIDATION is set
    vi.stubEnv("SKIP_ENV_VALIDATION", "");
    vi.stubEnv("CONTACT_EMAIL", "");

    // Force a fresh import to trigger env validation
    vi.resetModules();

    await expect(import("@/app/api/contact/route")).rejects.toThrow(
      "Invalid environment variables",
    );

    // Restore modules for subsequent tests
    vi.resetModules();
  });

  it("returns 500 when email send fails", async () => {
    mockSendContactEmail.mockRejectedValue(new Error("SMTP connection failed"));

    const { POST } = await import("@/app/api/contact/route");

    const req = createContactRequest(buildContactFormWithSecurity());
    const res = await POST(req);

    expect(res.status).toBe(500);
    const data = (await res.json()) as { code: string };
    expect(data.code).toBe("EMAIL_SEND_ERROR");
  });

  it("extracts IP from x-forwarded-for header", async () => {
    resetRateLimit("192.168.1.100");
    resetRateLimit("192.168.1.200");

    const { POST } = await import("@/app/api/contact/route");

    // Make 5 requests from one IP
    for (let i = 0; i < 5; i++) {
      const req = createContactRequest(buildContactFormWithSecurity(), "192.168.1.100");
      await POST(req);
    }

    // This IP should be rate limited
    const req1 = createContactRequest(buildContactFormWithSecurity(), "192.168.1.100");
    const res1 = await POST(req1);
    expect(res1.status).toBe(429);

    // Different IP should NOT be rate limited
    const req2 = createContactRequest(buildContactFormWithSecurity(), "192.168.1.200");
    const res2 = await POST(req2);
    expect(res2.status).toBe(200);
  });
});
