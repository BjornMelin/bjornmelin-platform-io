import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EmailService } from "@/lib/services/email";
import { ResendEmailService } from "@/lib/services/resend-email";
import { POST } from "../route";

// Mock services
vi.mock("@/lib/services/email");
vi.mock("@/lib/services/resend-email");
vi.mock("@/env.mjs", () => ({
  env: {
    USE_RESEND: false,
    RESEND_API_KEY: undefined,
  },
}));

// Mock security utilities
const mockCheckRateLimit = vi.fn();
const mockGetClientIp = vi.fn();
const mockSanitizeInput = vi.fn((input: string) => input);

vi.mock("@/lib/utils/security", () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
  getClientIp: (...args: unknown[]) => mockGetClientIp(...args),
  sanitizeInput: (...args: unknown[]) => mockSanitizeInput(...args),
}));

describe("Contact API Route", () => {
  let mockEmailService: {
    sendContactFormEmail: ReturnType<typeof vi.fn>;
  };
  let mockResendService: {
    sendContactFormEmail: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    mockGetClientIp.mockReturnValue("127.0.0.1");
    mockCheckRateLimit.mockReturnValue({
      allowed: true,
      remaining: 4,
      resetTime: Date.now() + 3600000,
    });

    // Mock email services
    mockEmailService = {
      sendContactFormEmail: vi.fn().mockResolvedValue(undefined),
    };
    mockResendService = {
      sendContactFormEmail: vi.fn().mockResolvedValue({ id: "test-id" }),
    };

    (EmailService.getInstance as ReturnType<typeof vi.fn>).mockReturnValue(mockEmailService);
    (ResendEmailService.getInstance as ReturnType<typeof vi.fn>).mockReturnValue(mockResendService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("successfully sends email with valid data", async () => {
    const validData = {
      name: "John Doe",
      email: "john@example.com",
      message: "This is a test message",
      honeypot: "",
      gdprConsent: true,
    };

    const request = new NextRequest("http://localhost:3000/api/contact", {
      method: "POST",
      body: JSON.stringify(validData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true });
    expect(mockEmailService.sendContactFormEmail).toHaveBeenCalledWith(validData);

    // Check rate limit headers
    expect(response.headers.get("X-RateLimit-Limit")).toBe("5");
    expect(response.headers.get("X-RateLimit-Remaining")).toBe("4");
  });

  it("rejects requests when rate limit is exceeded", async () => {
    mockCheckRateLimit.mockReturnValue({
      allowed: false,
      remaining: 0,
      resetTime: Date.now() + 3600000,
    });

    const request = new NextRequest("http://localhost:3000/api/contact", {
      method: "POST",
      body: JSON.stringify({
        name: "John Doe",
        email: "john@example.com",
        message: "Test message",
        gdprConsent: true,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error).toContain("Too many requests");
    expect(data.code).toBe("RATE_LIMIT_EXCEEDED");
    expect(response.headers.get("X-RateLimit-Remaining")).toBe("0");
  });

  it("silently accepts bot submissions (honeypot filled)", async () => {
    const botData = {
      name: "Bot Name",
      email: "bot@example.com",
      message: "Bot message",
      honeypot: "I am a bot",
      gdprConsent: true,
    };

    const request = new NextRequest("http://localhost:3000/api/contact", {
      method: "POST",
      body: JSON.stringify(botData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true });
    expect(mockEmailService.sendContactFormEmail).not.toHaveBeenCalled();
  });

  it("sanitizes input data before validation", async () => {
    mockSanitizeInput
      .mockReturnValueOnce("Sanitized Name")
      .mockReturnValueOnce("sanitized@email.com")
      .mockReturnValueOnce("Sanitized message content");

    const request = new NextRequest("http://localhost:3000/api/contact", {
      method: "POST",
      body: JSON.stringify({
        name: "<script>alert('xss')</script>Name",
        email: "test@email.com<script>",
        message: "Message with <script>bad stuff</script>",
        honeypot: "",
        gdprConsent: true,
      }),
    });

    await POST(request);

    expect(mockSanitizeInput).toHaveBeenCalledTimes(3);
    expect(mockEmailService.sendContactFormEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Sanitized Name",
        email: "sanitized@email.com",
        message: "Sanitized message content",
      }),
    );
  });

  it("returns validation error for invalid data", async () => {
    const invalidData = {
      name: "A", // Too short
      email: "invalid-email", // Invalid format
      message: "Too short", // Less than 10 chars
      gdprConsent: false, // Not consented
    };

    const request = new NextRequest("http://localhost:3000/api/contact", {
      method: "POST",
      body: JSON.stringify(invalidData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Validation failed");
    expect(data.details).toBeDefined();
    expect(Array.isArray(data.details)).toBe(true);
    expect(data.details.length).toBe(4); // 4 validation errors

    // Check specific validation errors
    const errors = data.details.map((e: { path: string[]; message: string }) => ({
      field: e.path[0],
      message: e.message,
    }));

    expect(errors).toContainEqual({
      field: "name",
      message: "Name must be at least 2 characters",
    });
    expect(errors).toContainEqual({
      field: "email",
      message: "Please enter a valid email address",
    });
    expect(errors).toContainEqual({
      field: "message",
      message: "Message must be at least 10 characters",
    });
    expect(errors).toContainEqual({
      field: "gdprConsent",
      message: "You must accept the privacy policy to submit this form",
    });

    expect(mockEmailService.sendContactFormEmail).not.toHaveBeenCalled();
  });

  it("handles missing required fields", async () => {
    const incompleteData = {
      name: "John Doe",
      // Missing email, message, and gdprConsent
    };

    const request = new NextRequest("http://localhost:3000/api/contact", {
      method: "POST",
      body: JSON.stringify(incompleteData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Validation failed");
    expect(data.details).toBeDefined();
    expect(Array.isArray(data.details)).toBe(true);

    // Check for missing field errors
    const missingFields = data.details
      .filter((e: { code: string }) => e.code === "invalid_type")
      .map((e: { path: string[] }) => e.path[0]);

    expect(missingFields).toContain("email");
    expect(missingFields).toContain("message");
    expect(missingFields).toContain("gdprConsent");

    expect(mockEmailService.sendContactFormEmail).not.toHaveBeenCalled();
  });

  it("uses Resend service when configured", async () => {
    // Mock env to use Resend
    const { env } = await import("@/env.mjs");
    (env as { USE_RESEND: boolean; RESEND_API_KEY: string }).USE_RESEND = true;
    (env as { USE_RESEND: boolean; RESEND_API_KEY: string }).RESEND_API_KEY = "test-key";

    const validData = {
      name: "John Doe",
      email: "john@example.com",
      message: "This is a test message",
      honeypot: "",
      gdprConsent: true,
    };

    const request = new NextRequest("http://localhost:3000/api/contact", {
      method: "POST",
      body: JSON.stringify(validData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true });
    expect(mockResendService.sendContactFormEmail).toHaveBeenCalledWith(validData);
    expect(mockEmailService.sendContactFormEmail).not.toHaveBeenCalled();

    // Reset env
    (env as { USE_RESEND: boolean; RESEND_API_KEY: string | undefined }).USE_RESEND = false;
    (env as { USE_RESEND: boolean; RESEND_API_KEY: string | undefined }).RESEND_API_KEY = undefined;
  });

  it("handles email service errors gracefully", async () => {
    mockEmailService.sendContactFormEmail.mockRejectedValue(new Error("Failed to send email"));

    const validData = {
      name: "John Doe",
      email: "john@example.com",
      message: "This is a test message",
      honeypot: "",
      gdprConsent: true,
    };

    const request = new NextRequest("http://localhost:3000/api/contact", {
      method: "POST",
      body: JSON.stringify(validData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain("Failed to send message");
    expect(data.code).toBe("EMAIL_SEND_ERROR");
  });

  it("handles JSON parsing errors", async () => {
    const request = new NextRequest("http://localhost:3000/api/contact", {
      method: "POST",
      body: "Invalid JSON {",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
    expect(data.code).toBe("INVALID_REQUEST");
  });

  it("validates name contains only allowed characters", async () => {
    const dataWithInvalidName = {
      name: "John123@#$",
      email: "john@example.com",
      message: "This is a test message",
      honeypot: "",
      gdprConsent: true,
    };

    const request = new NextRequest("http://localhost:3000/api/contact", {
      method: "POST",
      body: JSON.stringify(dataWithInvalidName),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Validation failed");
    expect(data.details).toBeDefined();
    expect(Array.isArray(data.details)).toBe(true);
    expect(
      data.details.some((err: { message: string }) =>
        err.message.includes("letters, spaces, hyphens, and apostrophes"),
      ),
    ).toBe(true);
  });

  it("enforces message length limits", async () => {
    const dataWithLongMessage = {
      name: "John Doe",
      email: "john@example.com",
      message: "A".repeat(1001), // Exceeds 1000 char limit
      honeypot: "",
      gdprConsent: true,
    };

    const request = new NextRequest("http://localhost:3000/api/contact", {
      method: "POST",
      body: JSON.stringify(dataWithLongMessage),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Validation failed");
    expect(data.details).toBeDefined();
    expect(Array.isArray(data.details)).toBe(true);
    expect(
      data.details.some((err: { message: string }) =>
        err.message.includes("less than 1000 characters"),
      ),
    ).toBe(true);
  });

  it("requires GDPR consent", async () => {
    const dataWithoutConsent = {
      name: "John Doe",
      email: "john@example.com",
      message: "This is a test message",
      honeypot: "",
      gdprConsent: false,
    };

    const request = new NextRequest("http://localhost:3000/api/contact", {
      method: "POST",
      body: JSON.stringify(dataWithoutConsent),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Validation failed");
    expect(data.details).toBeDefined();
    expect(Array.isArray(data.details)).toBe(true);
    expect(
      data.details.some((err: { message: string }) =>
        err.message.includes("accept the privacy policy"),
      ),
    ).toBe(true);
  });
});
