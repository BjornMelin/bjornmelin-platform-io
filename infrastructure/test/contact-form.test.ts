import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the SSM module
const getParameterMock = vi.fn();
let getParameterSpy: ReturnType<typeof vi.spyOn> | undefined;

// Mock Resend with controlled send function
const mockSend = vi.fn();
vi.mock("resend", () => ({
  Resend: class MockResend {
    emails = {
      send: mockSend,
    };
  },
}));

describe("contact-form Lambda handler", () => {
  beforeEach(async () => {
    // Reset modules to clear cached state
    vi.resetModules();

    // Set required env vars
    process.env.DOMAIN_NAME = "example.com";
    process.env.SSM_RECIPIENT_EMAIL_PARAM = "/portfolio/prod/CONTACT_EMAIL";
    process.env.SSM_RESEND_API_KEY_PARAM = "/portfolio/prod/resend/api-key";
    process.env.ALLOWED_ORIGINS = "https://example.com";

    // Reset mocks
    getParameterMock.mockReset();
    mockSend.mockReset();

    // Spy on the real module export so the handler's ESM import binding sees the mocked impl
    getParameterSpy?.mockRestore();
    const ssmModuleId = `/@fs${new URL("../lib/utils/ssm.ts", import.meta.url).pathname}`;
    const ssm = (await import(ssmModuleId)) as typeof import("../lib/utils/ssm");
    getParameterSpy = vi.spyOn(ssm, "getParameter").mockImplementation(getParameterMock);

    getParameterMock.mockImplementation(async (param: string) => {
      if (param.includes("CONTACT_EMAIL")) return "recipient@example.com";
      if (param.includes("api-key")) return "re_test_123";
      return "";
    });

    mockSend.mockResolvedValue({ error: null });
  });

  it("retrieves SSM parameters for recipient email and API key", async () => {
    const mod = await import("../lib/functions/contact-form/index");

    const event = {
      httpMethod: "POST",
      headers: { origin: "https://example.com" },
      body: JSON.stringify({
        name: "Test User",
        email: "user@example.com",
        message: "This is a test message for the contact form.",
      }),
    };

    // @ts-expect-error - simplified event for testing
    const result = await mod.handler(event);
    expect(result.statusCode).toBe(200);

    // Verify SSM parameters were retrieved
    expect(getParameterMock).toHaveBeenCalledWith("/portfolio/prod/CONTACT_EMAIL", true);
    expect(getParameterMock).toHaveBeenCalledWith("/portfolio/prod/resend/api-key", true);
  });

  it("returns 403 for disallowed origins", async () => {
    const mod = await import("../lib/functions/contact-form/index");

    const event = {
      httpMethod: "POST",
      headers: { origin: "https://malicious-site.com" },
      body: JSON.stringify({
        name: "Test",
        email: "test@test.com",
        message: "Test message here",
      }),
    };

    // @ts-expect-error - simplified event for testing
    const result = await mod.handler(event);
    expect(result.statusCode).toBe(403);
  });

  it("handles OPTIONS preflight requests", async () => {
    const mod = await import("../lib/functions/contact-form/index");

    const event = {
      httpMethod: "OPTIONS",
      headers: { origin: "https://example.com" },
    };

    // @ts-expect-error - simplified event for testing
    const result = await mod.handler(event);
    expect(result.statusCode).toBe(200);
    expect(result.headers?.["Access-Control-Allow-Origin"]).toBe("https://example.com");
  });

  it("validates input and returns 400 for invalid data", async () => {
    const mod = await import("../lib/functions/contact-form/index");

    const event = {
      httpMethod: "POST",
      headers: { origin: "https://example.com" },
      body: JSON.stringify({
        name: "A", // Too short
        email: "invalid-email",
        message: "Short", // Too short
      }),
    };

    // @ts-expect-error - simplified event for testing
    const result = await mod.handler(event);
    expect(result.statusCode).toBe(400);
  });

  it("returns 400 for missing request body", async () => {
    const mod = await import("../lib/functions/contact-form/index");

    const event = {
      httpMethod: "POST",
      headers: { origin: "https://example.com" },
      body: null,
    };

    // @ts-expect-error - simplified event for testing
    const result = await mod.handler(event);
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.message).toContain("Missing request body");
  });

  it("returns 400 for invalid JSON body", async () => {
    const mod = await import("../lib/functions/contact-form/index");

    const event = {
      httpMethod: "POST",
      headers: { origin: "https://example.com" },
      body: "not-valid-json",
    };

    // @ts-expect-error - simplified event for testing
    const result = await mod.handler(event);
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error).toBe("Invalid request format");
  });

  it("sends email with correct structure", async () => {
    const mod = await import("../lib/functions/contact-form/index");

    const event = {
      httpMethod: "POST",
      headers: { origin: "https://example.com" },
      body: JSON.stringify({
        name: "John Doe",
        email: "john@example.com",
        message: "Hello, this is my message!",
      }),
    };

    // @ts-expect-error - simplified event for testing
    await mod.handler(event);

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "Contact Form <contact@example.com>",
        to: "recipient@example.com",
        replyTo: "john@example.com",
        subject: "Contact Form: John Doe",
      }),
    );

    // Verify HTML and text content are included
    const callArgs = mockSend.mock.calls[0]?.[0] as Record<string, unknown> | undefined;
    expect(callArgs?.html).toContain("John Doe");
    expect(callArgs?.html).toContain("john@example.com");
    expect(callArgs?.text).toContain("John Doe");
    expect(callArgs?.text).toContain("john@example.com");
  });

  it("returns 500 on Resend API error", async () => {
    mockSend.mockResolvedValue({
      error: { message: "API key invalid", name: "validation_error" },
    });

    const mod = await import("../lib/functions/contact-form/index");

    const event = {
      httpMethod: "POST",
      headers: { origin: "https://example.com" },
      body: JSON.stringify({
        name: "Test User",
        email: "test@example.com",
        message: "Testing Resend error handling",
      }),
    };

    // @ts-expect-error - simplified event for testing
    const result = await mod.handler(event);
    expect(result.statusCode).toBe(500);

    // Error messages are sanitized to not leak internal details
    const body = JSON.parse(result.body);
    expect(body.error).toBe("Failed to send message");
    expect(body.message).toBe("An unexpected error occurred. Please try again later.");
  });

  it("returns 500 when SSM parameter is missing", async () => {
    getParameterMock.mockImplementation(async (param: string) => {
      if (param.includes("CONTACT_EMAIL")) return null;
      if (param.includes("api-key")) return "re_test_123";
      return "";
    });

    const mod = await import("../lib/functions/contact-form/index");

    const event = {
      httpMethod: "POST",
      headers: { origin: "https://example.com" },
      body: JSON.stringify({
        name: "Test User",
        email: "test@example.com",
        message: "Testing missing SSM parameter",
      }),
    };

    // @ts-expect-error - simplified event for testing
    const result = await mod.handler(event);
    expect(result.statusCode).toBe(500);

    // Error messages are sanitized to not leak internal configuration details
    const body = JSON.parse(result.body);
    expect(body.error).toBe("Failed to send message");
    expect(body.message).toBe("An unexpected error occurred. Please try again later.");
  });

  it("escapes HTML in email content to prevent XSS", async () => {
    const mod = await import("../lib/functions/contact-form/index");

    const event = {
      httpMethod: "POST",
      headers: { origin: "https://example.com" },
      body: JSON.stringify({
        name: "Evil<script>alert('xss')</script>User",
        email: "evil@example.com",
        message: "Message with <b>HTML</b> & special chars",
      }),
    };

    // @ts-expect-error - simplified event for testing
    await mod.handler(event);

    const callArgs = mockSend.mock.calls[0]?.[0] as Record<string, unknown> | undefined;
    const html = callArgs?.html as string;

    // Verify HTML is escaped
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&lt;b&gt;");
    expect(html).toContain("&amp;");
    expect(html).not.toContain("<script>");
  });
});
