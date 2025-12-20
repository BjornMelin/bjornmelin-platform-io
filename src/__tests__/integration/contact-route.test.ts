/* @vitest-environment node */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetRateLimit } from "@/lib/security/rate-limiter";

describe("POST /api/contact (integration)", () => {
  const testIp = "127.0.0.1";

  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("CONTACT_EMAIL", "recipient@example.com");
    vi.stubEnv("EMAIL_FROM", "Contact Form <noreply@example.com>");
    // Reset rate limit state for test IP
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

  it("returns 200 on valid payload when email sends successfully", async () => {
    const sendSpy = vi.fn().mockResolvedValue(undefined);
    vi.doMock("@/lib/email", () => ({
      sendContactEmail: sendSpy,
    }));

    const { POST } = await import("@/app/api/contact/route");
    const req = new Request("http://localhost/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": testIp,
      },
      body: JSON.stringify({
        name: "Alice",
        email: "a@example.com",
        message: "Hello world!!!",
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(sendSpy).toHaveBeenCalledOnce();
  });

  it("returns 429 when rate limit exceeded", async () => {
    const sendSpy = vi.fn().mockResolvedValue(undefined);
    vi.doMock("@/lib/email", () => ({
      sendContactEmail: sendSpy,
    }));

    const { POST } = await import("@/app/api/contact/route");

    // Make 5 successful requests
    for (let i = 0; i < 5; i++) {
      const req = new Request("http://localhost/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": testIp,
        },
        body: JSON.stringify({
          name: "Test User",
          email: "test@example.com",
          message: "Test message for rate limit",
        }),
      });
      await POST(req);
    }

    // 6th request should be rate limited
    const req = new Request("http://localhost/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": testIp,
      },
      body: JSON.stringify({
        name: "Test User",
        email: "test@example.com",
        message: "This should be rate limited",
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(429);

    const data = (await res.json()) as { error: string };
    expect(data.error).toContain("Too many requests");
  });

  it("returns 400 when honeypot field is filled (schema validation rejects non-empty)", async () => {
    const sendSpy = vi.fn().mockResolvedValue(undefined);
    vi.doMock("@/lib/email", () => ({
      sendContactEmail: sendSpy,
    }));

    const { POST } = await import("@/app/api/contact/route");
    const req = new Request("http://localhost/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": testIp,
      },
      body: JSON.stringify({
        name: "Bot User",
        email: "bot@example.com",
        message: "This is a bot submission",
        honeypot: "I am a bot", // Honeypot filled = schema validation fails
      }),
    });
    const res = await POST(req);

    // Schema validation rejects non-empty honeypot
    expect(res.status).toBe(400);
    const data = (await res.json()) as { code: string };
    expect(data.code).toBe("VALIDATION_ERROR");
  });

  it("does NOT send email when honeypot field is filled", async () => {
    const sendSpy = vi.fn().mockResolvedValue(undefined);
    vi.doMock("@/lib/email", () => ({
      sendContactEmail: sendSpy,
    }));

    const { POST } = await import("@/app/api/contact/route");
    const req = new Request("http://localhost/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": testIp,
      },
      body: JSON.stringify({
        name: "Bot User",
        email: "bot@example.com",
        message: "This is a bot submission",
        honeypot: "spam content",
      }),
    });
    const res = await POST(req);

    // Email should NOT be sent - validation fails before email sending
    expect(res.status).toBe(400);
    expect(sendSpy).not.toHaveBeenCalled();
  });

  it("returns 400 when submission too fast", async () => {
    const sendSpy = vi.fn().mockResolvedValue(undefined);
    vi.doMock("@/lib/email", () => ({
      sendContactEmail: sendSpy,
    }));

    const { POST } = await import("@/app/api/contact/route");

    // Form load time is current time (submission is instant)
    const formLoadTime = Date.now();

    const req = new Request("http://localhost/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": testIp,
      },
      body: JSON.stringify({
        name: "Fast Bot",
        email: "fast@example.com",
        message: "Submitted too quickly",
        formLoadTime,
      }),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string };
    expect(data.error).toContain("take your time");
  });

  it("throws at module load when CONTACT_EMAIL not configured", async () => {
    // CONTACT_EMAIL is now validated at module load time via env.mjs
    // Empty string fails the email validation
    // Ensure validation is enforced even in CI where SKIP_ENV_VALIDATION is set.
    vi.stubEnv("SKIP_ENV_VALIDATION", "");
    vi.stubEnv("CONTACT_EMAIL", "");

    await expect(import("@/app/api/contact/route")).rejects.toThrow(
      "Invalid environment variables",
    );
  });

  it("returns 500 when email send fails", async () => {
    const sendSpy = vi.fn().mockRejectedValue(new Error("SMTP connection failed"));
    vi.doMock("@/lib/email", () => ({
      sendContactEmail: sendSpy,
    }));

    const { POST } = await import("@/app/api/contact/route");
    const req = new Request("http://localhost/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": testIp,
      },
      body: JSON.stringify({
        name: "Test User",
        email: "test@example.com",
        message: "Testing email failure",
      }),
    });
    const res = await POST(req);

    expect(res.status).toBe(500);
    const data = (await res.json()) as { code: string };
    expect(data.code).toBe("EMAIL_SEND_ERROR");
  });

  it("extracts IP from x-forwarded-for header", async () => {
    // Reset rate limit for the specific IP we'll use
    resetRateLimit("192.168.1.100");

    const sendSpy = vi.fn().mockResolvedValue(undefined);
    vi.doMock("@/lib/email", () => ({
      sendContactEmail: sendSpy,
    }));

    const { POST } = await import("@/app/api/contact/route");

    // Make 5 requests from one IP
    for (let i = 0; i < 5; i++) {
      const req = new Request("http://localhost/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "192.168.1.100",
        },
        body: JSON.stringify({
          name: "Test",
          email: "test@example.com",
          message: "Rate limit test message",
        }),
      });
      await POST(req);
    }

    // This IP should be rate limited
    const req1 = new Request("http://localhost/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "192.168.1.100",
      },
      body: JSON.stringify({
        name: "Test",
        email: "test@example.com",
        message: "Should be limited",
      }),
    });
    const res1 = await POST(req1);
    expect(res1.status).toBe(429);

    // Different IP should NOT be rate limited
    const req2 = new Request("http://localhost/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "192.168.1.200",
      },
      body: JSON.stringify({
        name: "Test",
        email: "test@example.com",
        message: "Different IP should work",
      }),
    });
    const res2 = await POST(req2);
    expect(res2.status).toBe(200);

  });
});
