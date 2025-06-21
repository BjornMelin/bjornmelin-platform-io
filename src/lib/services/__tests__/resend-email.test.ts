import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { env } from "@/env.mjs";
import type { ContactFormData } from "@/lib/schemas/contact";
import { ResendEmailService } from "../resend-email";

// Mock env
vi.mock("@/env.mjs", () => ({
  env: {
    RESEND_API_KEY: "test-api-key",
    RESEND_FROM_EMAIL: "test@example.com",
    CONTACT_EMAIL: "contact@example.com",
  },
}));

// Create the mock send function
const mockSendFn = vi.fn();

// Mock Resend class
class MockResend {
  emails = {
    send: mockSendFn,
  };
}

vi.mock("resend", () => ({
  Resend: MockResend,
}));

describe("ResendEmailService", () => {
  let service: ResendEmailService;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset singleton instance
    (ResendEmailService as unknown as { instance: ResendEmailService | undefined }).instance =
      undefined;
    service = ResendEmailService.getInstance();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getInstance", () => {
    it("should return the same instance (singleton)", () => {
      const instance1 = ResendEmailService.getInstance();
      const instance2 = ResendEmailService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it("should throw error if RESEND_API_KEY is not configured", () => {
      // Temporarily remove API key
      const originalApiKey = env.RESEND_API_KEY;
      (env as { RESEND_API_KEY: string | undefined }).RESEND_API_KEY = undefined;
      (ResendEmailService as unknown as { instance: ResendEmailService | undefined }).instance =
        undefined;

      expect(() => ResendEmailService.getInstance()).toThrow("RESEND_API_KEY is not configured");

      // Restore API key
      (env as { RESEND_API_KEY: string | undefined }).RESEND_API_KEY = originalApiKey;
    });
  });

  describe("sendContactFormEmail", () => {
    const mockFormData: ContactFormData = {
      name: "John Doe",
      email: "john@example.com",
      message: "This is a test message",
      honeypot: "",
      gdprConsent: true,
    };

    it("should send email successfully", async () => {
      mockSendFn.mockResolvedValueOnce({
        data: { id: "test-email-id" },
        error: null,
      });

      const result = await service.sendContactFormEmail(mockFormData);

      expect(result).toEqual({ id: "test-email-id" });
      expect(mockSendFn).toHaveBeenCalledTimes(1);

      const callArgs = mockSendFn.mock.calls[0][0];
      expect(callArgs.from).toContain("test@example.com");
      expect(callArgs.to).toBe("contact@example.com");
      expect(callArgs.subject).toContain("John Doe");
      expect(callArgs.replyTo).toBe("john@example.com");
      expect(callArgs.text).toContain("John Doe");
      expect(callArgs.text).toContain("john@example.com");
      expect(callArgs.text).toContain("This is a test message");
      expect(callArgs.html).toContain("John Doe");
      expect(callArgs.html).toContain("john@example.com");
      expect(callArgs.html).toContain("This is a test message");
    });

    it("should handle Resend API errors", async () => {
      mockSendFn.mockResolvedValueOnce({
        data: null,
        error: { message: "Invalid API key" },
      });

      await expect(service.sendContactFormEmail(mockFormData)).rejects.toThrow(
        "Failed to send email: Invalid API key",
      );
    });

    it("should handle missing email ID in response", async () => {
      mockSendFn.mockResolvedValueOnce({
        data: {},
        error: null,
      });

      await expect(service.sendContactFormEmail(mockFormData)).rejects.toThrow(
        "Failed to send email: No email ID returned",
      );
    });

    it("should handle unexpected errors", async () => {
      mockSendFn.mockRejectedValueOnce(new Error("Network error"));

      await expect(service.sendContactFormEmail(mockFormData)).rejects.toThrow(
        "Failed to send email. Please try again later.",
      );
    });

    it("should include proper email formatting", async () => {
      mockSendFn.mockResolvedValueOnce({
        data: { id: "test-email-id" },
        error: null,
      });

      await service.sendContactFormEmail(mockFormData);

      const callArgs = mockSendFn.mock.calls[0][0];

      // Check HTML structure
      expect(callArgs.html).toContain("<!DOCTYPE html>");
      expect(callArgs.html).toContain("New Contact Form Submission");
      expect(callArgs.html).toContain("field-label");
      expect(callArgs.html).toContain("field-value");
      expect(callArgs.html).toContain("mailto:john@example.com");
      expect(callArgs.html).toContain("warning");
      expect(callArgs.html).toContain("bjornmelin.io");
    });
  });

  describe("sendTestEmail", () => {
    it("should send a test email with predefined data", async () => {
      mockSendFn.mockResolvedValueOnce({
        data: { id: "test-email-id" },
        error: null,
      });

      const result = await service.sendTestEmail();

      expect(result).toEqual({ id: "test-email-id" });
      expect(mockSendFn).toHaveBeenCalledTimes(1);

      const callArgs = mockSendFn.mock.calls[0][0];
      expect(callArgs.subject).toContain("Test User");
      expect(callArgs.text).toContain("This is a test message");
    });
  });

  describe("verifyConfiguration", () => {
    it("should return true when configuration is valid", async () => {
      mockSendFn.mockResolvedValueOnce({
        data: { id: "test-email-id" },
        error: null,
      });

      const result = await service.verifyConfiguration();

      expect(result).toBe(true);
      expect(mockSendFn).toHaveBeenCalledTimes(1);

      const callArgs = mockSendFn.mock.calls[0][0];
      expect(callArgs.subject).toBe("Resend Configuration Test");
    });

    it("should return false when configuration has errors", async () => {
      mockSendFn.mockResolvedValueOnce({
        data: null,
        error: { message: "Invalid configuration" },
      });

      const result = await service.verifyConfiguration();

      expect(result).toBe(false);
    });

    it("should return false when verification throws", async () => {
      mockSendFn.mockRejectedValueOnce(new Error("Network error"));

      const result = await service.verifyConfiguration();

      expect(result).toBe(false);
    });
  });
});
