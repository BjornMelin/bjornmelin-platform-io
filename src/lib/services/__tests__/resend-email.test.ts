import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { env } from "@/env.mjs";
import type { ContactFormData } from "@/lib/schemas/contact";
import { ParameterStoreService } from "../parameter-store";
import {
  ResendConfigurationError,
  ResendEmailError,
  ResendEmailService,
  ResendRateLimitError,
} from "../resend-email";

// Mock the Resend module
vi.mock("resend", () => {
  const mockSend = vi.fn();
  return {
    Resend: vi.fn().mockImplementation(() => ({
      emails: {
        send: mockSend,
      },
    })),
    __mockSend: mockSend, // Export for test access
  };
});

// Mock the env module
vi.mock("@/env.mjs", () => ({
  env: {
    RESEND_API_KEY: "test-api-key",
    RESEND_FROM_EMAIL: "test@example.com",
    CONTACT_EMAIL: "contact@example.com",
    AWS_REGION: "us-east-1",
  },
}));

// Mock the Parameter Store service
vi.mock("../parameter-store", () => ({
  ParameterStoreService: {
    getInstance: vi.fn().mockReturnValue({
      getResendApiKey: vi.fn().mockResolvedValue("test-api-key-from-parameter-store"),
      clearCache: vi.fn(),
    }),
  },
}));

describe("ResendEmailService", () => {
  let originalConsoleLog: typeof console.log;
  let originalConsoleError: typeof console.error;
  let originalConsoleWarn: typeof console.warn;
  let consoleLogSpy: ReturnType<typeof vi.fn>;
  let consoleErrorSpy: ReturnType<typeof vi.fn>;
  let consoleWarnSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Clear singleton instance
    // @ts-expect-error - accessing private property for testing
    ResendEmailService.instance = undefined;

    // Mock console methods
    originalConsoleLog = console.log;
    originalConsoleError = console.error;
    originalConsoleWarn = console.warn;
    consoleLogSpy = vi.fn();
    consoleErrorSpy = vi.fn();
    consoleWarnSpy = vi.fn();
    console.log = consoleLogSpy;
    console.error = consoleErrorSpy;
    console.warn = consoleWarnSpy;

    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  });

  describe("getInstance", () => {
    it("should return the same instance (singleton pattern)", () => {
      const instance1 = ResendEmailService.getInstance();
      const instance2 = ResendEmailService.getInstance();

      expect(instance1).toBe(instance2);
    });

    it("should throw error if RESEND_API_KEY is not configured", () => {
      // @ts-expect-error - modifying env for testing
      env.RESEND_API_KEY = "";

      expect(() => ResendEmailService.getInstance()).toThrow(ResendConfigurationError);
      expect(() => ResendEmailService.getInstance()).toThrowError(
        "RESEND_API_KEY is not configured",
      );

      // Restore the key
      // @ts-expect-error - modifying env for testing
      env.RESEND_API_KEY = "test-api-key";
    });
  });

  describe("sendContactFormEmail", () => {
    let service: ResendEmailService;
    let mockSend: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
      // Get mock send function
      const { Resend } = await import("resend");
      service = ResendEmailService.getInstance();
      // @ts-expect-error - accessing mock internals
      mockSend = new Resend().emails.send;
    });

    it("should successfully send contact form email", async () => {
      const testData: ContactFormData = {
        name: "John Doe",
        email: "john@example.com",
        message: "Test message",
        honeypot: "",
        gdprConsent: true,
      };

      const mockResponse = { id: "test-email-id-123" };
      mockSend.mockResolvedValueOnce({ data: mockResponse, error: null });

      const result = await service.sendContactFormEmail(testData);

      expect(result).toHaveProperty("id", "test-email-id-123");
      expect(result).toHaveProperty("timestamp");
      expect(mockSend).toHaveBeenCalledTimes(1);

      const callArgs = mockSend.mock.calls[0][0];
      expect(callArgs.from).toBe("Contact Form <test@example.com>");
      expect(callArgs.to).toBe("contact@example.com");
      expect(callArgs.subject).toBe("New Contact Form Submission from John Doe");
      expect(callArgs.replyTo).toBe("john@example.com");
      expect(callArgs.text).toContain("Name: John Doe");
      expect(callArgs.text).toContain("Email: john@example.com");
      expect(callArgs.text).toContain("Message: Test message");
      expect(callArgs.html).toContain("John Doe");
      expect(callArgs.html).toContain("john@example.com");
      expect(callArgs.html).toContain("Test message");

      // Check that the success log was called
      const successLogCall = consoleLogSpy.mock.calls.find((call) =>
        call[0].includes("Email sent successfully with ID: test-email-id-123"),
      );
      expect(successLogCall).toBeDefined();
    });

    it("should handle Resend API errors", async () => {
      const testData: ContactFormData = {
        name: "Jane Doe",
        email: "jane@example.com",
        message: "Test error message",
        honeypot: "",
        gdprConsent: true,
      };

      const mockError = { message: "Invalid API key" };
      mockSend.mockResolvedValueOnce({ data: null, error: mockError });

      // Call only once since mock is consumed
      await expect(service.sendContactFormEmail(testData)).rejects.toThrow(ResendEmailError);

      // Check that the Resend API error was logged
      const errorLogCall = consoleErrorSpy.mock.calls.find((call) =>
        call[0].includes("Resend API error"),
      );
      expect(errorLogCall).toBeDefined();
      expect(errorLogCall?.[1]).toEqual(mockError);
    });

    it("should handle missing email ID in response", async () => {
      const testData: ContactFormData = {
        name: "Bob Smith",
        email: "bob@example.com",
        message: "Test no ID message",
        honeypot: "",
        gdprConsent: true,
      };

      mockSend.mockResolvedValueOnce({ data: {}, error: null });

      await expect(service.sendContactFormEmail(testData)).rejects.toThrow(ResendEmailError);
      await expect(service.sendContactFormEmail(testData)).rejects.toThrowError(
        "Failed to send email. Please try again later.",
      );
    });

    it("should handle unexpected errors with retry logic", async () => {
      const testData: ContactFormData = {
        name: "Alice Johnson",
        email: "alice@example.com",
        message: "Test unexpected error",
        honeypot: "",
        gdprConsent: true,
      };

      const networkError = new Error("Network error");
      // First attempt fails with network error, second attempt succeeds
      mockSend
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce({ data: { id: "retry-success-id" }, error: null });

      const result = await service.sendContactFormEmail(testData);

      expect(result).toHaveProperty("id", "retry-success-id");
      expect(mockSend).toHaveBeenCalledTimes(2);

      // Check retry logging - both formats should match
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[ResendEmailService\].*retrying in \d+ms/),
        networkError,
      );
    });

    it("should fail after max retries", async () => {
      const testData: ContactFormData = {
        name: "Max Retry",
        email: "retry@example.com",
        message: "Test max retries",
        honeypot: "",
        gdprConsent: true,
      };

      const networkError = new Error("Network error");
      // All attempts fail
      mockSend.mockRejectedValue(networkError);

      // Use faster retry options for testing
      await expect(
        service.sendContactFormEmail(testData, {
          maxRetries: 2,
          initialDelay: 10,
          maxDelay: 50,
          backoffMultiplier: 2,
        }),
      ).rejects.toThrow(ResendEmailError);

      // 2 retries, so 3 total attempts
      expect(mockSend).toHaveBeenCalledTimes(3);
    }, 10000); // Increase timeout for retry test

    it("should generate proper email template with timestamp", async () => {
      const testData: ContactFormData = {
        name: "Template Test",
        email: "template@example.com",
        message: "Testing email template generation",
        honeypot: "",
        gdprConsent: true,
      };

      mockSend.mockResolvedValueOnce({ data: { id: "template-test-id" }, error: null });

      await service.sendContactFormEmail(testData);

      const callArgs = mockSend.mock.calls[0][0];

      // Check email structure
      expect(callArgs).toHaveProperty("from");
      expect(callArgs).toHaveProperty("to");
      expect(callArgs).toHaveProperty("subject");
      expect(callArgs).toHaveProperty("text");
      expect(callArgs).toHaveProperty("html");
      expect(callArgs).toHaveProperty("replyTo");

      // Check HTML template contains required elements
      expect(callArgs.html).toContain("<!DOCTYPE html>");
      expect(callArgs.html).toContain("New Contact Form Submission");
      expect(callArgs.html).toContain("Template Test");
      expect(callArgs.html).toContain("template@example.com");
      expect(callArgs.html).toContain("Testing email template generation");
      expect(callArgs.html).toContain("This is an automated message from bjornmelin.io");

      // Check text version
      expect(callArgs.text).toMatch(/Name: Template Test/);
      expect(callArgs.text).toMatch(/Email: template@example.com/);
      expect(callArgs.text).toMatch(/Message: Testing email template generation/);
      expect(callArgs.text).toMatch(/Time: .+/); // Timestamp should be present
    });
  });

  describe("sendTestEmail", () => {
    let service: ResendEmailService;
    let mockSend: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
      const { Resend } = await import("resend");
      service = ResendEmailService.getInstance();
      // @ts-expect-error - accessing mock internals
      mockSend = new Resend().emails.send;
    });

    it("should send test email with predefined data", async () => {
      const mockResponse = { id: "test-email-id" };
      mockSend.mockResolvedValueOnce({ data: mockResponse, error: null });

      const result = await service.sendTestEmail();

      expect(result).toHaveProperty("id", "test-email-id");
      expect(result).toHaveProperty("timestamp");
      expect(mockSend).toHaveBeenCalledTimes(1);

      const callArgs = mockSend.mock.calls[0][0];
      expect(callArgs.subject).toBe("New Contact Form Submission from Test User");
      expect(callArgs.text).toContain("Name: Test User");
      expect(callArgs.text).toContain("Email: test@example.com");
      expect(callArgs.text).toContain("This is a test message from the contact form.");
    });
  });

  describe("verifyConfiguration", () => {
    let service: ResendEmailService;
    let mockSend: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
      const { Resend } = await import("resend");
      service = ResendEmailService.getInstance();
      // @ts-expect-error - accessing mock internals
      mockSend = new Resend().emails.send;
    });

    it("should return true when configuration is valid", async () => {
      mockSend.mockResolvedValueOnce({ data: { id: "config-test-id" }, error: null });

      const result = await service.verifyConfiguration();

      expect(result).toBe(true);
      expect(mockSend).toHaveBeenCalledWith({
        from: "test@example.com",
        to: "contact@example.com",
        subject: "Resend Configuration Test",
        text: "This is a test email to verify Resend configuration.",
      });
    });

    it("should return false when configuration has errors", async () => {
      const mockError = { message: "Invalid configuration" };
      mockSend.mockResolvedValueOnce({ data: null, error: mockError });

      const result = await service.verifyConfiguration();

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[ResendEmailService\].*Resend configuration error/),
        mockError,
      );
    });

    it("should handle exceptions and return false", async () => {
      const error = new Error("Unexpected error");
      mockSend.mockRejectedValueOnce(error);

      const result = await service.verifyConfiguration();

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[ResendEmailService\].*Failed to verify Resend configuration/),
        error,
      );
    });

    it("should use default values when env variables are not set", async () => {
      // @ts-expect-error - modifying env for testing
      env.RESEND_FROM_EMAIL = "";
      // @ts-expect-error - modifying env for testing
      env.CONTACT_EMAIL = "";

      mockSend.mockResolvedValueOnce({ data: { id: "default-test-id" }, error: null });

      await service.verifyConfiguration();

      expect(mockSend).toHaveBeenCalledWith({
        from: "no-reply@bjornmelin.io",
        to: "bjornmelin16@gmail.com",
        subject: "Resend Configuration Test",
        text: "This is a test email to verify Resend configuration.",
      });

      // Restore env values
      // @ts-expect-error - modifying env for testing
      env.RESEND_FROM_EMAIL = "test@example.com";
      // @ts-expect-error - modifying env for testing
      env.CONTACT_EMAIL = "contact@example.com";
    });
  });

  describe("ContactEmailTemplate edge cases", () => {
    let service: ResendEmailService;
    let mockSend: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
      const { Resend } = await import("resend");
      service = ResendEmailService.getInstance();
      // @ts-expect-error - accessing mock internals
      mockSend = new Resend().emails.send;
    });

    it("should handle empty env variables in email template", async () => {
      // Temporarily clear env values
      const originalFromEmail = env.RESEND_FROM_EMAIL;
      const originalContactEmail = env.CONTACT_EMAIL;

      // @ts-expect-error - modifying env for testing
      env.RESEND_FROM_EMAIL = "";
      // @ts-expect-error - modifying env for testing
      env.CONTACT_EMAIL = "";

      const testData: ContactFormData = {
        name: "Default Test",
        email: "default@example.com",
        message: "Testing default values",
        honeypot: "",
        gdprConsent: true,
      };

      mockSend.mockResolvedValueOnce({ data: { id: "default-email-id" }, error: null });

      await service.sendContactFormEmail(testData);

      const callArgs = mockSend.mock.calls[0][0];
      expect(callArgs.from).toBe("Contact Form <no-reply@bjornmelin.io>");
      expect(callArgs.to).toBe("bjornmelin16@gmail.com");

      // Restore env values
      // @ts-expect-error - modifying env for testing
      env.RESEND_FROM_EMAIL = originalFromEmail;
      // @ts-expect-error - modifying env for testing
      env.CONTACT_EMAIL = originalContactEmail;
    });
  });

  describe("sendBatchEmails", () => {
    let service: ResendEmailService;
    let mockSend: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
      const { Resend } = await import("resend");
      service = ResendEmailService.getInstance();
      // @ts-expect-error - accessing mock internals
      mockSend = new Resend().emails.send;
    });

    it("should send multiple emails successfully", async () => {
      const emails = [
        {
          data: {
            name: "User 1",
            email: "user1@example.com",
            message: "Message 1",
            honeypot: "",
            gdprConsent: true,
          } as ContactFormData,
        },
        {
          data: {
            name: "User 2",
            email: "user2@example.com",
            message: "Message 2",
            honeypot: "",
            gdprConsent: true,
          } as ContactFormData,
        },
      ];

      mockSend
        .mockResolvedValueOnce({ data: { id: "email-1" }, error: null })
        .mockResolvedValueOnce({ data: { id: "email-2" }, error: null });

      const result = await service.sendBatchEmails(emails);

      expect(result.successful).toHaveLength(2);
      expect(result.failed).toHaveLength(0);
      expect(result.successful[0]).toHaveProperty("id", "email-1");
      expect(result.successful[1]).toHaveProperty("id", "email-2");
    });

    it("should handle partial failures in batch", async () => {
      const emails = [
        {
          data: {
            name: "Success User",
            email: "success@example.com",
            message: "Success message",
            honeypot: "",
            gdprConsent: true,
          } as ContactFormData,
        },
        {
          data: {
            name: "Fail User",
            email: "fail@example.com",
            message: "Fail message",
            honeypot: "",
            gdprConsent: true,
          } as ContactFormData,
        },
      ];

      mockSend
        .mockResolvedValueOnce({ data: { id: "success-id" }, error: null })
        .mockResolvedValueOnce({ data: null, error: { message: "Invalid email" } });

      const result = await service.sendBatchEmails(emails);

      expect(result.successful).toHaveLength(1);
      expect(result.failed).toHaveLength(1);
      expect(result.successful[0]).toHaveProperty("id", "success-id");
      expect(result.failed[0].email).toBe("fail@example.com");
      expect(result.failed[0].error).toBeInstanceOf(ResendEmailError);
    });
  });

  describe("getHealthStatus", () => {
    let service: ResendEmailService;
    let mockSend: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
      const { Resend } = await import("resend");
      service = ResendEmailService.getInstance();
      // @ts-expect-error - accessing mock internals
      mockSend = new Resend().emails.send;
    });

    it("should return healthy status when configuration is valid", async () => {
      mockSend.mockResolvedValueOnce({ data: { id: "health-check-id" }, error: null });

      const status = await service.getHealthStatus();

      expect(status.healthy).toBe(true);
      expect(status.version).toBe("2.0.0");
      expect(status.configuration).toHaveProperty("fromEmail");
      expect(status.configuration).toHaveProperty("contactEmail");
      expect(status.configuration).toHaveProperty("retryOptions");
      expect(status.lastError).toBeUndefined();
    });

    it("should return unhealthy status when configuration fails", async () => {
      mockSend.mockResolvedValueOnce({ data: null, error: { message: "Configuration error" } });

      const status = await service.getHealthStatus();

      expect(status.healthy).toBe(false);
      expect(status.version).toBe("2.0.0");
      expect(status.lastError).toBeUndefined();
    });

    it("should handle exceptions in health check and include error message", async () => {
      // Mock verifyConfiguration to throw an error
      vi.spyOn(service, "verifyConfiguration").mockRejectedValueOnce(
        new Error("Health check failed"),
      );

      const status = await service.getHealthStatus();

      expect(status.healthy).toBe(false);
      expect(status.version).toBe("2.0.0");
      expect(status.lastError).toBe("Health check failed");
      expect(status.configuration).toHaveProperty("fromEmail");
      expect(status.configuration).toHaveProperty("contactEmail");
      expect(status.configuration).toHaveProperty("retryOptions");
    });
  });

  describe("getWebhookEvent", () => {
    let service: ResendEmailService;

    beforeEach(() => {
      service = ResendEmailService.getInstance();
    });

    it("should return placeholder webhook event", async () => {
      const eventId = "webhook-event-123";
      const result = await service.getWebhookEvent(eventId);

      expect(result).toHaveProperty("id", eventId);
      expect(result).toHaveProperty("status", "pending");
      expect(result).toHaveProperty("message", "Webhook event retrieval not yet implemented");

      // Check that warning was logged
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringMatching(
          /\[ResendEmailService\].*Webhook event retrieval not yet implemented/,
        ),
        "",
      );
    });

    it("should handle errors in webhook event retrieval", async () => {
      // Mock the internal log method to throw an error
      // @ts-expect-error - accessing private method for testing
      vi.spyOn(service, "log").mockImplementationOnce(() => {
        throw new Error("Log error");
      });

      await expect(service.getWebhookEvent("error-event")).rejects.toThrow(ResendEmailError);
    });
  });

  describe("validateWebhookSignature", () => {
    let service: ResendEmailService;
    let originalNodeEnv: string | undefined;

    beforeEach(() => {
      service = ResendEmailService.getInstance();
      originalNodeEnv = process.env.NODE_ENV;
    });

    afterEach(() => {
      Object.defineProperty(process.env, "NODE_ENV", {
        value: originalNodeEnv,
        writable: true,
        configurable: true,
      });
    });

    it("should return true in development environment", () => {
      Object.defineProperty(process.env, "NODE_ENV", {
        value: "development",
        writable: true,
        configurable: true,
      });
      const result = service.validateWebhookSignature("payload", "signature", "secret");
      expect(result).toBe(true);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringMatching(
          /\[ResendEmailService\].*Webhook signature validation not yet implemented/,
        ),
        "",
      );
    });

    it("should return false in production environment", () => {
      Object.defineProperty(process.env, "NODE_ENV", {
        value: "production",
        writable: true,
        configurable: true,
      });
      const result = service.validateWebhookSignature("payload", "signature", "secret");
      expect(result).toBe(false);
    });

    it("should handle errors and return false", () => {
      // Mock the internal log method to throw an error
      // @ts-expect-error - accessing private method for testing
      vi.spyOn(service, "log").mockImplementationOnce(() => {
        throw new Error("Validation error");
      });

      const result = service.validateWebhookSignature("payload", "signature", "secret");
      expect(result).toBe(false);
    });
  });

  describe("error handling edge cases", () => {
    let service: ResendEmailService;
    let mockSend: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
      const { Resend } = await import("resend");
      service = ResendEmailService.getInstance();
      // @ts-expect-error - accessing mock internals
      mockSend = new Resend().emails.send;
    });

    it("should handle rate limit errors with specific error type", async () => {
      const testData: ContactFormData = {
        name: "Rate Limit Test",
        email: "ratelimit@example.com",
        message: "Testing rate limit",
        honeypot: "",
        gdprConsent: true,
      };

      const rateLimitError = {
        message: "You have exceeded the rate limit",
        name: "rate_limit_exceeded",
      };
      mockSend.mockResolvedValueOnce({ data: null, error: rateLimitError });

      await expect(
        service.sendContactFormEmail(testData, {
          maxRetries: 0, // Don't retry for this test
        }),
      ).rejects.toThrow(ResendRateLimitError);
    });

    it("should handle validation errors with specific error type", async () => {
      const testData: ContactFormData = {
        name: "Validation Test",
        email: "invalid@example.com",
        message: "Testing validation",
        honeypot: "",
        gdprConsent: true,
      };

      const validationError = {
        message: "Invalid email format",
        name: "validation_error",
      };
      mockSend.mockResolvedValueOnce({ data: null, error: validationError });

      // The handleResendError will throw ResendEmailError with validation error details
      try {
        await service.sendContactFormEmail(testData, {
          maxRetries: 0, // Don't retry for this test
        });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeInstanceOf(ResendEmailError);
        // The error message is the original validation error message
        expect((error as ResendEmailError).message).toBe("Invalid email format");
        expect((error as ResendEmailError).code).toBe("VALIDATION_ERROR");
        expect((error as ResendEmailError).statusCode).toBe(400);
        expect((error as ResendEmailError).originalError).toBeDefined();
      }
    });

    it("should identify retryable network errors", async () => {
      const testData: ContactFormData = {
        name: "Network Test",
        email: "network@example.com",
        message: "Testing network error",
        honeypot: "",
        gdprConsent: true,
      };

      // Test ECONNREFUSED error
      mockSend
        .mockRejectedValueOnce(new Error("ECONNREFUSED: Connection refused"))
        .mockResolvedValueOnce({ data: { id: "retry-econnrefused" }, error: null });

      let result = await service.sendContactFormEmail(testData, {
        maxRetries: 1,
        initialDelay: 10,
      });
      expect(result).toHaveProperty("id", "retry-econnrefused");

      // Test ENOTFOUND error
      mockSend
        .mockRejectedValueOnce(new Error("ENOTFOUND: DNS lookup failed"))
        .mockResolvedValueOnce({ data: { id: "retry-enotfound" }, error: null });

      result = await service.sendContactFormEmail(testData, {
        maxRetries: 1,
        initialDelay: 10,
      });
      expect(result).toHaveProperty("id", "retry-enotfound");

      // Test timeout error
      mockSend
        .mockRejectedValueOnce(new Error("Request timeout"))
        .mockResolvedValueOnce({ data: { id: "retry-timeout" }, error: null });

      result = await service.sendContactFormEmail(testData, {
        maxRetries: 1,
        initialDelay: 10,
      });
      expect(result).toHaveProperty("id", "retry-timeout");

      // Test generic network error
      mockSend
        .mockRejectedValueOnce(new Error("Network error occurred"))
        .mockResolvedValueOnce({ data: { id: "retry-network" }, error: null });

      result = await service.sendContactFormEmail(testData, {
        maxRetries: 1,
        initialDelay: 10,
      });
      expect(result).toHaveProperty("id", "retry-network");
    }, 10000);

    it("should handle 5xx status codes as retryable", async () => {
      const testData: ContactFormData = {
        name: "Server Error Test",
        email: "server@example.com",
        message: "Testing server error",
        honeypot: "",
        gdprConsent: true,
      };

      // Create a custom error that mimics a ResendEmailError with 500 status
      const serverError = new ResendEmailError("Internal Server Error", "SERVER_ERROR", 500);

      // First attempt fails with 500 error, second succeeds
      mockSend
        .mockRejectedValueOnce(serverError)
        .mockResolvedValueOnce({ data: { id: "retry-after-500" }, error: null });

      const result = await service.sendContactFormEmail(testData, {
        maxRetries: 1,
        initialDelay: 10,
      });

      expect(result).toHaveProperty("id", "retry-after-500");
      expect(mockSend).toHaveBeenCalledTimes(2);
    });
  });
});
