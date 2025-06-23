import { describe, expect, it, vi } from "vitest";
import {
  enhancedContactFormSchema,
  serverContactFormSchema,
  validateContactForm,
  validateContactFormServer,
  type EnhancedContactFormData,
} from "../contact-schema";

describe("Enhanced Contact Form Schema Validation", () => {
  describe("Valid Input Tests", () => {
    it("should validate a complete valid form submission", () => {
      const validData = {
        name: "John Doe",
        email: "john.doe@example.com",
        message: "This is a test message with more than 10 characters",
        csrfToken: "valid-csrf-token-12345",
        honeypot: "",
        gdprConsent: true,
        clientInfo: {
          userAgent: "Mozilla/5.0",
          timestamp: Date.now(),
          timezone: "America/New_York",
        },
      };

      const result = enhancedContactFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should allow names with apostrophes, hyphens, and spaces", () => {
      const validNames = [
        "Mary-Jane O'Brien",
        "Jean-Pierre Le Grand",
        "D'Angelo Williams",
        "Ana Maria da Silva",
      ];

      validNames.forEach((name) => {
        const data = {
          name,
          email: "test@example.com",
          message: "Valid message content here",
          csrfToken: "token123",
          honeypot: "",
          gdprConsent: true,
        };

        const result = enhancedContactFormSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it("should transform email to lowercase", () => {
      const data = {
        name: "Test User",
        email: "Test.User@EXAMPLE.COM",
        message: "This is a test message",
        csrfToken: "token123",
        honeypot: "",
        gdprConsent: true,
      };

      const result = enhancedContactFormSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("test.user@example.com");
      }
    });

    it("should allow optional fields", () => {
      const data = {
        name: "Test User",
        email: "test@example.com",
        message: "This is a test message",
        csrfToken: "token123",
        honeypot: "",
        gdprConsent: true,
        company: "Acme Corp",
        phone: "+1-555-0123",
      };

      const result = enhancedContactFormSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.company).toBe("Acme Corp");
        expect(result.data.phone).toBe("+1-555-0123");
      }
    });
  });

  describe("Security Validation Tests", () => {
    it("should sanitize HTML and XSS attempts in name field", () => {
      const maliciousNames = [
        { input: "<script>alert('xss')</script>John", expected: "John" },
        { input: "John<img src=x onerror=alert('xss')>", expected: "John" },
        { input: "javascript:alert('xss')", expected: "" },
        { input: "John onclick=alert('xss')", expected: "John" },
      ];

      maliciousNames.forEach(({ input, expected }) => {
        const data = {
          name: input,
          email: "test@example.com",
          message: "Valid message",
          csrfToken: "token123",
          honeypot: "",
          gdprConsent: true,
        };

        const result = enhancedContactFormSchema.safeParse(data);
        if (expected === "") {
          expect(result.success).toBe(false);
        } else if (result.success) {
          expect(result.data.name).toBe(expected);
        }
      });
    });

    it("should reject SQL injection attempts in message", () => {
      const sqlInjections = [
        "SELECT * FROM users WHERE 1=1",
        "'; DROP TABLE messages; --",
        "UNION SELECT username, password FROM users",
        "INSERT INTO hack VALUES ('evil')",
        "UPDATE users SET admin=true",
        "DELETE FROM messages WHERE 1=1",
      ];

      sqlInjections.forEach((injection) => {
        const data = {
          name: "Test User",
          email: "test@example.com",
          message: injection,
          csrfToken: "token123",
          honeypot: "",
          gdprConsent: true,
        };

        const result = enhancedContactFormSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          const messageError = result.error.errors.find((e) => e.path[0] === "message");
          expect(messageError?.message).toBe("Message contains invalid content");
        }
      });
    });

    it("should reject messages with too many URLs (spam detection)", () => {
      const spamMessage = `
        Check out these links:
        https://spam1.com
        https://spam2.com
        https://spam3.com
        This is too many URLs!
      `;

      const data = {
        name: "Test User",
        email: "test@example.com",
        message: spamMessage,
        csrfToken: "token123",
        honeypot: "",
        gdprConsent: true,
      };

      const result = enhancedContactFormSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        const messageError = result.error.errors.find((e) => e.path[0] === "message");
        expect(messageError?.message).toBe("Too many URLs detected. Maximum 2 URLs allowed.");
      }
    });

    it("should reject messages with repeated characters (spam detection)", () => {
      const spamMessage = "aaaaaaaaaaaaaaaaaaaaaaaaaaaa spam message";

      const data = {
        name: "Test User",
        email: "test@example.com",
        message: spamMessage,
        csrfToken: "token123",
        honeypot: "",
        gdprConsent: true,
      };

      const result = enhancedContactFormSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        const messageError = result.error.errors.find((e) => e.path[0] === "message");
        expect(messageError?.message).toBe("Message appears to be spam");
      }
    });

    it("should reject disposable email addresses", () => {
      const disposableEmails = [
        "test@tempmail.com",
        "user@throwaway.email",
        "spam@guerrillamail.com",
        "fake@mailinator.com",
        "temp@10minutemail.com",
      ];

      disposableEmails.forEach((email) => {
        const data = {
          name: "Test User",
          email,
          message: "Valid message content",
          csrfToken: "token123",
          honeypot: "",
          gdprConsent: true,
        };

        const result = enhancedContactFormSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          const emailError = result.error.errors.find((e) => e.path[0] === "email");
          expect(emailError?.message).toBe("Disposable email addresses are not allowed");
        }
      });
    });

    it("should reject honeypot field with content (bot detection)", () => {
      const data = {
        name: "Bot User",
        email: "bot@example.com",
        message: "This is a bot message",
        csrfToken: "token123",
        honeypot: "I'm a bot!",
        gdprConsent: true,
      };

      const result = enhancedContactFormSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        const honeypotError = result.error.errors.find((e) => e.path[0] === "honeypot");
        expect(honeypotError?.message).toBe("Bot detection triggered");
      }
    });

    it("should reject expired timestamps (replay attack prevention)", () => {
      const data = {
        name: "Test User",
        email: "test@example.com",
        message: "Valid message",
        csrfToken: "token123",
        honeypot: "",
        gdprConsent: true,
        clientInfo: {
          userAgent: "Mozilla/5.0",
          timestamp: Date.now() - 6 * 60 * 1000, // 6 minutes ago
          timezone: "America/New_York",
        },
      };

      const result = enhancedContactFormSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        const timestampError = result.error.errors.find(
          (e) => e.path.includes("timestamp")
        );
        expect(timestampError?.message).toBe("Request expired. Please refresh and try again.");
      }
    });
  });

  describe("Email Validation Edge Cases", () => {
    it("should validate complex but valid email formats", () => {
      const validEmails = [
        "test+filter@example.com",
        "user.name@example.com",
        "123@example.com",
        "a@example.co.uk",
        "test@subdomain.example.com",
      ];

      validEmails.forEach((email) => {
        const data = {
          name: "Test User",
          email,
          message: "Valid message",
          csrfToken: "token123",
          honeypot: "",
          gdprConsent: true,
        };

        const result = enhancedContactFormSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid email formats", () => {
      const invalidEmails = [
        ".test@example.com", // Starts with dot
        "test.@example.com", // Ends with dot
        "test..test@example.com", // Double dots
        "test@.example.com", // Domain starts with dot
        "test@example", // No TLD
        "test@", // No domain
        "@example.com", // No local part
        "test test@example.com", // Space in email
        "test@exam ple.com", // Space in domain
        "a".repeat(65) + "@example.com", // Local part too long
        "test@" + "a".repeat(254) + ".com", // Domain too long
      ];

      invalidEmails.forEach((email) => {
        const data = {
          name: "Test User",
          email,
          message: "Valid message",
          csrfToken: "token123",
          honeypot: "",
          gdprConsent: true,
        };

        const result = enhancedContactFormSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });
  });

  describe("Input Length Validation", () => {
    it("should enforce minimum lengths", () => {
      const shortData = {
        name: "J", // Too short
        email: "a@b.c", // Valid but minimum
        message: "Too short", // Less than 10 chars
        csrfToken: "token123",
        honeypot: "",
        gdprConsent: true,
      };

      const result = enhancedContactFormSchema.safeParse(shortData);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        const errors = result.error.errors;
        expect(errors.some((e) => e.path[0] === "name")).toBe(true);
        expect(errors.some((e) => e.path[0] === "message")).toBe(true);
      }
    });

    it("should enforce maximum lengths", () => {
      const longData = {
        name: "a".repeat(51), // Too long
        email: "test@" + "a".repeat(250) + ".com", // Too long
        message: "a".repeat(1001), // Too long
        csrfToken: "token123",
        honeypot: "",
        gdprConsent: true,
        company: "a".repeat(101), // Too long
      };

      const result = enhancedContactFormSchema.safeParse(longData);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        const errors = result.error.errors;
        expect(errors.some((e) => e.path[0] === "name")).toBe(true);
        expect(errors.some((e) => e.path[0] === "email")).toBe(true);
        expect(errors.some((e) => e.path[0] === "message")).toBe(true);
        expect(errors.some((e) => e.path[0] === "company")).toBe(true);
      }
    });
  });

  describe("validateContactForm Helper Function", () => {
    it("should return success with sanitized data", () => {
      const data = {
        name: "  John Doe  ", // Should be trimmed
        email: "JOHN@EXAMPLE.COM", // Should be lowercased
        message: "Valid message with <script>alert('xss')</script>", // Should be sanitized
        csrfToken: "token123",
        honeypot: "",
        gdprConsent: true,
      };

      const result = validateContactForm(data);
      
      expect(result.success).toBe(true);
      expect(result.sanitized).toBe(true);
      if (result.data) {
        expect(result.data.name).toBe("John Doe");
        expect(result.data.email).toBe("john@example.com");
        expect(result.data.message).not.toContain("<script>");
      }
    });

    it("should return errors for invalid data", () => {
      const invalidData = {
        name: "",
        email: "invalid-email",
        message: "short",
        csrfToken: "",
        gdprConsent: false,
      };

      const result = validateContactForm(invalidData);
      
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe("Server-side Validation", () => {
    it("should validate with additional server fields", () => {
      const data = {
        name: "Test User",
        email: "test@example.com",
        message: "Valid message content",
        csrfToken: "token123",
        honeypot: "",
        gdprConsent: true,
      };

      const result = validateContactFormServer(
        data,
        "192.168.1.1",
        { "User-Agent": "Mozilla/5.0" }
      );

      expect(result.success).toBe(true);
      expect(result.sanitized).toBe(true);
    });

    it("should include IP and headers in validation", () => {
      const data = {
        name: "Test User",
        email: "test@example.com",
        message: "Valid message content",
        csrfToken: "token123",
        honeypot: "",
        gdprConsent: true,
      };

      const result = serverContactFormSchema.safeParse({
        ...data,
        ipAddress: "192.168.1.1",
        headers: { "User-Agent": "Mozilla/5.0" },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ipAddress).toBe("192.168.1.1");
        expect(result.data.headers).toEqual({ "User-Agent": "Mozilla/5.0" });
      }
    });
  });

  describe("Phone Number Validation", () => {
    it("should accept valid phone number formats", () => {
      const validPhones = [
        "123-456-7890",
        "(123) 456-7890",
        "123.456.7890",
        "+1-123-456-7890",
        "1234567890",
        "+44 20 7123 4567",
      ];

      validPhones.forEach((phone) => {
        const data = {
          name: "Test User",
          email: "test@example.com",
          message: "Valid message",
          csrfToken: "token123",
          honeypot: "",
          gdprConsent: true,
          phone,
        };

        const result = enhancedContactFormSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid phone number formats", () => {
      const invalidPhones = [
        "abc-def-ghij", // Letters
        "123-456-789012345678901", // Too long
        "!@#$%^&*()", // Special chars
      ];

      invalidPhones.forEach((phone) => {
        const data = {
          name: "Test User",
          email: "test@example.com",
          message: "Valid message",
          csrfToken: "token123",
          honeypot: "",
          gdprConsent: true,
          phone,
        };

        const result = enhancedContactFormSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });
  });

  describe("GDPR Compliance", () => {
    it("should require GDPR consent", () => {
      const data = {
        name: "Test User",
        email: "test@example.com",
        message: "Valid message",
        csrfToken: "token123",
        honeypot: "",
        // gdprConsent missing
      };

      const result = enhancedContactFormSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        const gdprError = result.error.errors.find((e) => e.path[0] === "gdprConsent");
        expect(gdprError?.message).toBe("You must accept the privacy policy to submit this form");
      }
    });

    it("should reject false GDPR consent", () => {
      const data = {
        name: "Test User",
        email: "test@example.com",
        message: "Valid message",
        csrfToken: "token123",
        honeypot: "",
        gdprConsent: false,
      };

      const result = enhancedContactFormSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        const gdprError = result.error.errors.find((e) => e.path[0] === "gdprConsent");
        expect(gdprError?.message).toBe("You must accept the privacy policy to submit this form");
      }
    });
  });

  describe("Type Safety", () => {
    it("should reject non-string types for text fields", () => {
      const invalidData = {
        name: 123, // Should be string
        email: { email: "test@example.com" }, // Should be string
        message: ["This is a message"], // Should be string
        csrfToken: true, // Should be string
        honeypot: null,
        gdprConsent: true,
      };

      const result = enhancedContactFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject non-boolean for gdprConsent", () => {
      const data = {
        name: "Test User",
        email: "test@example.com",
        message: "Valid message",
        csrfToken: "token123",
        honeypot: "",
        gdprConsent: "true", // Should be boolean
      };

      const result = enhancedContactFormSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("XSS Prevention", () => {
    it("should sanitize various XSS attempts", () => {
      const xssAttempts = [
        { field: "name", value: "<img src=x onerror=alert(1)>" },
        { field: "message", value: "<iframe src='javascript:alert(1)'></iframe>" },
        { field: "company", value: "<svg onload=alert(1)>" },
      ];

      xssAttempts.forEach(({ field, value }) => {
        const data: any = {
          name: "Test User",
          email: "test@example.com",
          message: "Valid message",
          csrfToken: "token123",
          honeypot: "",
          gdprConsent: true,
        };
        
        data[field] = value;

        const result = enhancedContactFormSchema.safeParse(data);
        
        if (result.success) {
          // Check that dangerous content was removed
          expect(result.data[field as keyof EnhancedContactFormData]).not.toContain("<");
          expect(result.data[field as keyof EnhancedContactFormData]).not.toContain(">");
          expect(result.data[field as keyof EnhancedContactFormData]).not.toContain("alert");
        }
      });
    });
  });
});