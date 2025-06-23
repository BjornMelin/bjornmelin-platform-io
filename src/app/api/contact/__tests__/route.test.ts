import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ResendEmailService } from "@/lib/services/resend-email";
import { POST } from "../route";

// Mock security utilities - must be defined before vi.mock
const mockCheckRateLimit = vi.fn();
const mockGetClientIp = vi.fn();
const mockSanitizeInput = vi.fn((input: string) => input);

// Mock services
vi.mock("@/lib/services/resend-email");
vi.mock("@/env.mjs", () => ({
  env: {
    RESEND_API_KEY: "test-resend-key",
    RESEND_FROM_EMAIL: "test@example.com",
    CONTACT_EMAIL: "contact@example.com",
  },
}));

vi.mock("@/lib/utils/security", () => ({
  checkRateLimit: vi.fn(() => mockCheckRateLimit()),
  getClientIp: vi.fn(() => mockGetClientIp()),
  sanitizeInput: vi.fn((input: string) => mockSanitizeInput(input)),
}));

describe("Contact API Route", () => {
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

    // Mock Resend email service
    mockResendService = {
      sendContactFormEmail: vi.fn().mockResolvedValue({ id: "test-id" }),
    };

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
    expect(data).toEqual({ success: true, emailId: "test-id" });
    expect(mockResendService.sendContactFormEmail).toHaveBeenCalledWith(validData);

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
    expect(mockResendService.sendContactFormEmail).not.toHaveBeenCalled();
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
    expect(mockResendService.sendContactFormEmail).toHaveBeenCalledWith(
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

    expect(mockResendService.sendContactFormEmail).not.toHaveBeenCalled();
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

    expect(mockResendService.sendContactFormEmail).not.toHaveBeenCalled();
  });

  it("handles email service errors gracefully", async () => {
    mockResendService.sendContactFormEmail.mockRejectedValue(new Error("Failed to send email"));

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
    expect(data.error).toBe("Failed to send email");
    expect(data.code).toBe("INTERNAL_SERVER_ERROR");
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
