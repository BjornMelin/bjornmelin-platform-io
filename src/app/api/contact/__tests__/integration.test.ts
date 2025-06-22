import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";
import { POST } from "../route";

// Mock the email service
vi.mock("@/lib/services/resend-email", () => ({
  ResendEmailService: {
    getInstance: vi.fn().mockReturnValue({
      sendContactFormEmail: vi.fn().mockResolvedValue({ id: "test-id" }),
    }),
  },
}));

// Mock security utilities
vi.mock("@/lib/utils/security", () => ({
  checkRateLimit: vi.fn().mockReturnValue({
    allowed: true,
    remaining: 4,
    resetTime: Date.now() + 3600000,
  }),
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
  sanitizeInput: vi.fn((input: string) => input),
  generateCSRFToken: vi.fn().mockReturnValue("test-token"),
  validateCSRFToken: vi.fn().mockReturnValue(true),
}));

// Mock env
vi.mock("@/env.mjs", () => ({
  env: {
    RESEND_API_KEY: "test-resend-key",
    RESEND_FROM_EMAIL: "test@example.com",
    CONTACT_EMAIL: "contact@example.com",
  },
}));

describe("Contact API Integration Tests", () => {
  it("complete successful form submission flow", async () => {
    const formData = {
      name: "John Doe",
      email: "john@example.com",
      message: "This is a test message for the contact form",
      honeypot: "",
      gdprConsent: true,
    };

    const request = new NextRequest("http://localhost:3000/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "192.168.1.1",
      },
      body: JSON.stringify(formData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true });
    expect(response.headers.get("X-RateLimit-Limit")).toBe("5");
    expect(response.headers.get("X-RateLimit-Remaining")).toBe("4");
  });

  it("handles validation workflow correctly", async () => {
    const invalidData = {
      name: "J", // Too short
      email: "not-an-email", // Invalid
      message: "Short", // Too short
      honeypot: "", // Add missing honeypot field
      gdprConsent: false, // Not accepted
    };

    const request = new NextRequest("http://localhost:3000/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(invalidData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Validation failed");
    expect(data.details).toHaveLength(4);

    // Verify all validation errors are present
    const errorPaths = data.details.map((e: { path: string[] }) => e.path[0]);
    expect(errorPaths).toContain("name");
    expect(errorPaths).toContain("email");
    expect(errorPaths).toContain("message");
    expect(errorPaths).toContain("gdprConsent");
  });

  it("handles security features correctly", async () => {
    // Test with honeypot filled (bot detection)
    const botData = {
      name: "Bot Name",
      email: "bot@example.com",
      message: "This is a bot message",
      honeypot: "I'm a bot!",
      gdprConsent: true,
    };

    const request = new NextRequest("http://localhost:3000/api/contact", {
      method: "POST",
      body: JSON.stringify(botData),
    });

    const response = await POST(request);
    const data = await response.json();

    // Should return success but not actually send email
    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true });
  });

  it("handles edge cases gracefully", async () => {
    // Test with unicode and special characters
    const unicodeData = {
      name: "José María O'Brien-Smith",
      email: "test+filter@example.com",
      message: "Message with emojis 🎉 and special chars: & < > \" '",
      honeypot: "",
      gdprConsent: true,
    };

    const request = new NextRequest("http://localhost:3000/api/contact", {
      method: "POST",
      body: JSON.stringify(unicodeData),
    });

    const response = await POST(request);
    const data = await response.json();

    // Name with accents should fail regex validation
    expect(response.status).toBe(400);
    expect(data.error).toBe("Validation failed");
  });

  it("handles malformed requests", async () => {
    // Test with malformed JSON
    const request = new NextRequest("http://localhost:3000/api/contact", {
      method: "POST",
      body: "{ invalid json",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid JSON in request body");
    expect(data.code).toBe("INVALID_REQUEST");
  });

  it("handles missing content-type", async () => {
    const formData = {
      name: "John Doe",
      email: "john@example.com",
      message: "This is a test message",
      honeypot: "",
      gdprConsent: true,
    };

    const request = new NextRequest("http://localhost:3000/api/contact", {
      method: "POST",
      // No Content-Type header
      body: JSON.stringify(formData),
    });

    const response = await POST(request);
    const data = await response.json();

    // Should still work
    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true });
  });
});
