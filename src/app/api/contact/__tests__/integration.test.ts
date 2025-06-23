import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkCSRFToken } from "@/lib/security/csrf-modern";
import { applyRateLimit, getClientIP } from "@/lib/security/rate-limiter";
import { ResendEmailService } from "@/lib/services/resend-email";
import { OPTIONS, POST } from "../route";

// Type definitions for API responses
interface ValidationErrorDetail {
  field: string;
  message: string;
}

// Removed unused interface - ValidationErrorDetail is sufficient

// Mock modules
vi.mock("@/lib/services/resend-email");
vi.mock("@/lib/security/csrf");
vi.mock("@/lib/security/rate-limiter");

// Mock next/headers for CSRF
const mockHeaders = new Map<string, string>();
vi.mock("next/headers", () => ({
  headers: vi.fn(() => ({
    get: vi.fn((key: string) => mockHeaders.get(key) || null),
  })),
}));

describe("Contact API Integration Tests", () => {
  let mockResendService: {
    sendContactFormEmail: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockHeaders.clear();
    mockHeaders.set("x-session-id", "test-session-id");

    // Setup default mocks
    mockResendService = {
      sendContactFormEmail: vi.fn().mockResolvedValue({ id: "test-email-id" }),
    };

    (ResendEmailService.getInstance as ReturnType<typeof vi.fn>).mockReturnValue(mockResendService);

    // Default rate limiting behavior
    (applyRateLimit as ReturnType<typeof vi.fn>).mockReturnValue({
      allowed: true,
      limit: 5,
      remaining: 4,
      reset: Date.now() + 900000,
    });

    (getClientIP as ReturnType<typeof vi.fn>).mockReturnValue("192.168.1.1");

    // Default CSRF behavior
    (checkCSRFToken as ReturnType<typeof vi.fn>).mockResolvedValue({
      valid: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Successful Requests", () => {
    it("should process valid contact form submission", async () => {
      const validData = {
        name: "John Doe",
        email: "john@example.com",
        message: "This is a test message with sufficient length",
        csrfToken: "valid-token",
        honeypot: "",
        gdprConsent: true,
        clientInfo: {
          userAgent: "Mozilla/5.0",
          timestamp: Date.now(),
          timezone: "America/New_York",
        },
      };

      const request = new Request("http://localhost:3000/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": "valid-token",
          "x-session-id": "test-session-id",
        },
        body: JSON.stringify(validData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.emailId).toBe("test-email-id");
      expect(data.message).toBe("Thank you for your message. We'll be in touch soon!");

      // Check rate limit headers
      expect(response.headers.get("X-RateLimit-Limit")).toBe("5");
      expect(response.headers.get("X-RateLimit-Remaining")).toBe("4");
    });

    it("should handle optional fields correctly", async () => {
      const dataWithOptionalFields = {
        name: "Jane Smith",
        email: "jane@example.com",
        message: "Test message with optional fields",
        csrfToken: "valid-token",
        honeypot: "",
        gdprConsent: true,
        company: "Tech Corp",
        phone: "+1-555-0123",
      };

      const request = new Request("http://localhost:3000/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": "valid-token",
        },
        body: JSON.stringify(dataWithOptionalFields),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe("Security Tests", () => {
    describe("CSRF Protection", () => {
      it("should reject requests without CSRF token", async () => {
        (checkCSRFToken as ReturnType<typeof vi.fn>).mockResolvedValue({
          valid: false,
          error: "Invalid or missing CSRF token",
        });

        const request = new Request("http://localhost:3000/api/contact", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "Test User",
            email: "test@example.com",
            message: "Test message",
            honeypot: "",
            gdprConsent: true,
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(403);
        expect(data.error).toBe("Invalid or missing CSRF token");
        expect(data.code).toBe("CSRF_VALIDATION_FAILED");
        expect(mockResendService.sendContactFormEmail).not.toHaveBeenCalled();
      });

      it("should reject requests with invalid CSRF token", async () => {
        (checkCSRFToken as ReturnType<typeof vi.fn>).mockResolvedValue({
          valid: false,
          error: "Invalid or missing CSRF token",
        });

        const request = new Request("http://localhost:3000/api/contact", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": "invalid-token",
          },
          body: JSON.stringify({
            name: "Test User",
            email: "test@example.com",
            message: "Test message",
            csrfToken: "invalid-token",
            honeypot: "",
            gdprConsent: true,
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(403);
        expect(data.code).toBe("CSRF_VALIDATION_FAILED");
      });
    });

    describe("Rate Limiting", () => {
      it("should enforce rate limits", async () => {
        (applyRateLimit as ReturnType<typeof vi.fn>).mockReturnValue({
          allowed: false,
          limit: 5,
          remaining: 0,
          reset: Date.now() + 900000,
          retryAfter: 900,
        });

        const request = new Request("http://localhost:3000/api/contact", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": "valid-token",
          },
          body: JSON.stringify({
            name: "Test User",
            email: "test@example.com",
            message: "Test message",
            csrfToken: "valid-token",
            honeypot: "",
            gdprConsent: true,
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(429);
        expect(data.error).toBe("Too many requests");
        expect(response.headers.get("Retry-After")).toBe("900");
        expect(mockResendService.sendContactFormEmail).not.toHaveBeenCalled();
      });

      it("should track requests per IP", async () => {
        const _requests = [];

        // First 5 requests should succeed
        for (let i = 0; i < 5; i++) {
          (applyRateLimit as ReturnType<typeof vi.fn>).mockReturnValue({
            allowed: true,
            limit: 5,
            remaining: 4 - i,
            reset: Date.now() + 900000,
          });

          const request = new Request("http://localhost:3000/api/contact", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-csrf-token": "valid-token",
              "x-forwarded-for": "192.168.1.100",
            },
            body: JSON.stringify({
              name: `User ${i}`,
              email: `user${i}@example.com`,
              message: `Test message number ${i}`,
              csrfToken: "valid-token",
              honeypot: "",
              gdprConsent: true,
            }),
          });

          const response = await POST(request);
          expect(response.status).toBe(200);
        }

        // 6th request should be rate limited
        (applyRateLimit as ReturnType<typeof vi.fn>).mockReturnValue({
          allowed: false,
          limit: 5,
          remaining: 0,
          reset: Date.now() + 900000,
          retryAfter: 900,
        });

        const blockedRequest = new Request("http://localhost:3000/api/contact", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": "valid-token",
            "x-forwarded-for": "192.168.1.100",
          },
          body: JSON.stringify({
            name: "Blocked User",
            email: "blocked@example.com",
            message: "This should be blocked",
            csrfToken: "valid-token",
            honeypot: "",
            gdprConsent: true,
          }),
        });

        const response = await POST(blockedRequest);
        expect(response.status).toBe(429);
      });
    });

    describe("Input Validation & Sanitization", () => {
      it("should reject SQL injection attempts", async () => {
        const sqlInjectionData = {
          name: "Robert'); DROP TABLE users;--",
          email: "test@example.com",
          message: "SELECT * FROM users WHERE 1=1",
          csrfToken: "valid-token",
          honeypot: "",
          gdprConsent: true,
        };

        const request = new Request("http://localhost:3000/api/contact", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": "valid-token",
          },
          body: JSON.stringify(sqlInjectionData),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.code).toBe("VALIDATION_ERROR");
        expect(data.details).toBeDefined();
        expect(mockResendService.sendContactFormEmail).not.toHaveBeenCalled();
      });

      it("should sanitize XSS attempts", async () => {
        const xssData = {
          name: "John<script>alert('xss')</script>",
          email: "test@example.com",
          message: "Message with <img src=x onerror=alert('xss')>",
          csrfToken: "valid-token",
          honeypot: "",
          gdprConsent: true,
        };

        const request = new Request("http://localhost:3000/api/contact", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": "valid-token",
          },
          body: JSON.stringify(xssData),
        });

        const response = await POST(request);
        const data = await response.json();

        // Should either sanitize and accept, or reject based on implementation
        if (response.status === 200) {
          // If accepted, ensure email was sent with sanitized data
          expect(mockResendService.sendContactFormEmail).toHaveBeenCalledWith(
            expect.objectContaining({
              name: expect.not.stringContaining("<script>"),
              message: expect.not.stringContaining("<img"),
            }),
          );
        } else {
          expect(response.status).toBe(400);
          expect(data.code).toBe("VALIDATION_ERROR");
        }
      });

      it("should reject disposable email addresses", async () => {
        const disposableEmailData = {
          name: "Test User",
          email: "test@tempmail.com",
          message: "Test message with disposable email",
          csrfToken: "valid-token",
          honeypot: "",
          gdprConsent: true,
        };

        const request = new Request("http://localhost:3000/api/contact", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": "valid-token",
          },
          body: JSON.stringify(disposableEmailData),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.code).toBe("VALIDATION_ERROR");
        expect(data.details).toBeDefined();
        const emailError = data.details?.find((e: ValidationErrorDetail) => e.field === "email");
        expect(emailError?.message).toBe("Disposable email addresses are not allowed");
      });

      it("should reject messages with too many URLs", async () => {
        const spamMessage = `
          Check out: https://spam1.com
          And: https://spam2.com
          Also: https://spam3.com
        `;

        const request = new Request("http://localhost:3000/api/contact", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": "valid-token",
          },
          body: JSON.stringify({
            name: "Spammer",
            email: "test@example.com",
            message: spamMessage,
            csrfToken: "valid-token",
            honeypot: "",
            gdprConsent: true,
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.code).toBe("VALIDATION_ERROR");
      });
    });

    describe("Bot Protection", () => {
      it("should silently accept honeypot submissions without processing", async () => {
        const botData = {
          name: "Bot Name",
          email: "bot@example.com",
          message: "I am a bot message",
          csrfToken: "valid-token",
          honeypot: "I filled this field!",
          gdprConsent: true,
        };

        const request = new Request("http://localhost:3000/api/contact", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": "valid-token",
          },
          body: JSON.stringify(botData),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(mockResendService.sendContactFormEmail).not.toHaveBeenCalled();
      });

      it("should reject expired timestamps", async () => {
        const oldTimestampData = {
          name: "Test User",
          email: "test@example.com",
          message: "Test message",
          csrfToken: "valid-token",
          honeypot: "",
          gdprConsent: true,
          clientInfo: {
            userAgent: "Mozilla/5.0",
            timestamp: Date.now() - 6 * 60 * 1000, // 6 minutes old
            timezone: "America/New_York",
          },
        };

        const request = new Request("http://localhost:3000/api/contact", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": "valid-token",
          },
          body: JSON.stringify(oldTimestampData),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.code).toBe("VALIDATION_ERROR");
        const timestampError = data.details?.find((e: ValidationErrorDetail) =>
          e.field.includes("timestamp"),
        );
        expect(timestampError?.message).toBe("Request expired. Please refresh and try again.");
      });
    });

    describe("Error Handling", () => {
      it("should handle invalid JSON gracefully", async () => {
        const request = new Request("http://localhost:3000/api/contact", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": "valid-token",
          },
          body: "{ invalid json",
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe("Invalid JSON in request body");
        expect(data.code).toBe("INVALID_REQUEST");
      });

      it("should handle invalid request body type", async () => {
        const request = new Request("http://localhost:3000/api/contact", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": "valid-token",
          },
          body: JSON.stringify(null),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe("Invalid request body");
        expect(data.code).toBe("INVALID_REQUEST");
      });

      it("should handle email service errors", async () => {
        mockResendService.sendContactFormEmail.mockRejectedValue(
          new Error("Email service unavailable"),
        );

        const request = new Request("http://localhost:3000/api/contact", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": "valid-token",
          },
          body: JSON.stringify({
            name: "Test User",
            email: "test@example.com",
            message: "Test message",
            csrfToken: "valid-token",
            honeypot: "",
            gdprConsent: true,
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBeDefined();
      });
    });

    describe("CORS and OPTIONS", () => {
      it("should handle OPTIONS requests for CORS preflight", async () => {
        const response = await OPTIONS();

        expect(response.status).toBe(200);
        expect(response.headers.get("Access-Control-Allow-Methods")).toBe("POST, OPTIONS");
        expect(response.headers.get("Access-Control-Allow-Headers")).toBe(
          "Content-Type, X-CSRF-Token, X-Session-ID",
        );
      });
    });

    describe("Headers and IP Detection", () => {
      it("should extract IP from various headers", async () => {
        const headers = [
          { "x-forwarded-for": "203.0.113.1, 198.51.100.1" },
          { "x-real-ip": "203.0.113.2" },
          { "cf-connecting-ip": "203.0.113.3" },
        ];

        for (const headerSet of headers) {
          const baseHeaders: Record<string, string> = {
            "Content-Type": "application/json",
            "x-csrf-token": "valid-token",
          };
          // Only add defined header values
          for (const [key, value] of Object.entries(headerSet)) {
            if (value !== undefined) {
              baseHeaders[key] = value;
            }
          }
          const request = new Request("http://localhost:3000/api/contact", {
            method: "POST",
            headers: baseHeaders,
            body: JSON.stringify({
              name: "Test User",
              email: "test@example.com",
              message: "Test message",
              csrfToken: "valid-token",
              honeypot: "",
              gdprConsent: true,
            }),
          });

          const response = await POST(request);
          expect(response.status).toBe(200);
        }
      });
    });

    describe("GDPR Compliance", () => {
      it("should reject submissions without GDPR consent", async () => {
        const request = new Request("http://localhost:3000/api/contact", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": "valid-token",
          },
          body: JSON.stringify({
            name: "Test User",
            email: "test@example.com",
            message: "Test message",
            csrfToken: "valid-token",
            honeypot: "",
            gdprConsent: false,
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.code).toBe("VALIDATION_ERROR");
        const gdprError = data.details?.find(
          (e: ValidationErrorDetail) => e.field === "gdprConsent",
        );
        expect(gdprError?.message).toBe("You must accept the privacy policy to submit this form");
      });
    });
  });
});
