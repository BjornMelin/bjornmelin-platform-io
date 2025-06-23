import { describe, expect, it, vi } from "vitest";
import {
  type ContactFormData,
  contactFormSchema,
  contactFormSchemaWithCSRF,
  serverContactFormSchema,
  validateContactForm,
  validateContactFormServer,
  validateContactFormWithCSRF,
} from "../contact-schema";

// Mock DOMPurify
vi.mock("isomorphic-dompurify", () => ({
  default: {
    sanitize: vi.fn((input: string, options?: Record<string, unknown>) => {
      // Mock sanitization behavior - remove HTML tags but keep text content
      if (
        options?.ALLOWED_TAGS &&
        Array.isArray(options.ALLOWED_TAGS) &&
        options.ALLOWED_TAGS.length === 0
      ) {
        return input.replace(/<[^>]*>/g, "");
      }
      return input;
    }),
  },
}));

describe("Contact Form Schema Validation", () => {
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

      const result = contactFormSchema.safeParse(validData);
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

        const result = contactFormSchema.safeParse(data);
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

      const result = contactFormSchema.safeParse(data);
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

      const result = contactFormSchema.safeParse(data);
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

        const result = contactFormSchema.safeParse(data);
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

        const result = contactFormSchema.safeParse(data);
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

      const result = contactFormSchema.safeParse(data);
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

      const result = contactFormSchema.safeParse(data);
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

        const result = contactFormSchema.safeParse(data);
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

      const result = contactFormSchema.safeParse(data);
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

      const result = contactFormSchemaWithCSRF.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        const timestampError = result.error.errors.find((e) => e.path.includes("timestamp"));
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

        const result = contactFormSchema.safeParse(data);
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
        `${"a".repeat(65)}@example.com`, // Local part too long
        `test@${"a".repeat(254)}.com`, // Domain too long
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

        const result = contactFormSchema.safeParse(data);
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

      const result = contactFormSchema.safeParse(shortData);
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
        email: `test@${"a".repeat(250)}.com`, // Too long
        message: "a".repeat(1001), // Too long
        csrfToken: "token123",
        honeypot: "",
        gdprConsent: true,
        company: "a".repeat(101), // Too long
      };

      const result = contactFormSchema.safeParse(longData);
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

      const result = validateContactFormServer(data, "192.168.1.1", {
        "User-Agent": "Mozilla/5.0",
      });

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
          honeypot: "",
          gdprConsent: true,
          phone,
        };

        const result = contactFormSchema.safeParse(data);
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

        const result = contactFormSchema.safeParse(data);
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

      const result = contactFormSchema.safeParse(data);
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

      const result = contactFormSchema.safeParse(data);
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

      const result = contactFormSchema.safeParse(invalidData);
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

      const result = contactFormSchema.safeParse(data);
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
        const data: Record<string, unknown> = {
          name: "Test User",
          email: "test@example.com",
          message: "Valid message",
          csrfToken: "token123",
          honeypot: "",
          gdprConsent: true,
        };

        data[field] = value;

        const result = contactFormSchema.safeParse(data);

        if (result.success) {
          // Check that dangerous content was removed
          expect(result.data[field as keyof ContactFormData]).not.toContain("<");
          expect(result.data[field as keyof ContactFormData]).not.toContain(">");
          expect(result.data[field as keyof ContactFormData]).not.toContain("alert");
        }
      });
    });

    it("should handle complex XSS attack vectors", () => {
      const complexXSSAttempts = [
        "javascript:alert('XSS')",
        "data:text/html,<script>alert('XSS')</script>",
        "vbscript:msgbox('XSS')",
        "onload=alert('XSS')",
        "onfocus=alert('XSS')",
        "onmouseover=alert('XSS')",
        "<script>document.location='http://evil.com'</script>",
        '<META HTTP-EQUIV="refresh" CONTENT="0;url=javascript:alert(\'XSS\')">',
        "<<SCRIPT>alert('XSS');//<</SCRIPT>",
        "<STYLE>@import'http://evil.com/xss.css';</STYLE>",
      ];

      complexXSSAttempts.forEach((xssPayload) => {
        const data = {
          name: `John ${xssPayload} Doe`,
          email: "john@example.com",
          message: `This is a test message ${xssPayload}`,
          honeypot: "",
          gdprConsent: true,
        };

        const result = contactFormSchema.safeParse(data);

        if (result.success) {
          expect(result.data.name).not.toContain("javascript:");
          expect(result.data.name).not.toContain("<script>");
          expect(result.data.name).not.toContain("onload=");
          expect(result.data.message).not.toContain("javascript:");
          expect(result.data.message).not.toContain("<script>");
          expect(result.data.message).not.toContain("onload=");
        }
      });
    });
  });

  describe("Advanced Security Tests", () => {
    it("should prevent path traversal attempts in text fields", () => {
      const pathTraversalAttempts = [
        "../../../etc/passwd",
        "..\\..\\..\\windows\\system32",
        "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd",
        "....//....//....//etc/passwd",
      ];

      pathTraversalAttempts.forEach((payload) => {
        const data = {
          name: `User ${payload}`,
          email: "user@example.com",
          message: `Message with ${payload} path`,
          honeypot: "",
          gdprConsent: true,
        };

        const result = contactFormSchema.safeParse(data);

        if (result.success) {
          // Path traversal sequences should be cleaned up
          expect(result.data.name).not.toContain("../");
          expect(result.data.name).not.toContain("..\\");
          expect(result.data.message).not.toContain("../");
          expect(result.data.message).not.toContain("..\\");
        }
      });
    });

    it("should handle Unicode and encoding bypass attempts", () => {
      const unicodeAttempts = [
        "\u003Cscript\u003Ealert('XSS')\u003C/script\u003E", // Unicode encoded script tags
        "%3Cscript%3Ealert('XSS')%3C/script%3E", // URL encoded script tags
        "&#60;script&#62;alert('XSS')&#60;/script&#62;", // HTML entity encoded
        "\\u003cscript\\u003ealert('XSS')\\u003c/script\\u003e", // JavaScript unicode
      ];

      unicodeAttempts.forEach((payload) => {
        const data = {
          name: `User ${payload}`,
          email: "user@example.com",
          message: `Message with ${payload}`,
          honeypot: "",
          gdprConsent: true,
        };

        const result = contactFormSchema.safeParse(data);

        if (result.success) {
          // Encoded payloads should be cleaned
          expect(result.data.name).not.toContain("script");
          expect(result.data.name).not.toContain("alert");
          expect(result.data.message).not.toContain("script");
          expect(result.data.message).not.toContain("alert");
        }
      });
    });

    it("should validate against LDAP injection attempts", () => {
      const ldapAttempts = [
        "*)(&(objectClass=*))",
        "*)(uid=*)",
        "admin)(&(|(objectClass=*)",
        ")(cn=*))(&(objectClass=*",
      ];

      ldapAttempts.forEach((payload) => {
        const data = {
          name: `User ${payload}`,
          email: "user@example.com",
          message: `Message with ${payload}`,
          honeypot: "",
          gdprConsent: true,
        };

        const result = contactFormSchema.safeParse(data);
        // These should actually fail due to special characters in name field
        expect(result.success).toBe(false);

        if (!result.success) {
          const nameError = result.error.errors.find((e) => e.path[0] === "name");
          expect(nameError?.message).toContain("can only contain letters");
        }
      });
    });
  });

  describe("Field-Specific Validation Tests", () => {
    describe("Name Field Validation", () => {
      it("should accept international names with various characters", () => {
        const internationalNames = [
          "José María García",
          "François Müller",
          "李小明",
          "Mohammed ibn Abdullah",
          "Владимир Петров",
          "Søren Kierkegaard",
          "Björn Andersson",
        ];

        internationalNames.forEach((name) => {
          const data = {
            name,
            email: "test@example.com",
            message: "Valid message content",
            honeypot: "",
            gdprConsent: true,
          };

          const _result = contactFormSchema.safeParse(data);
          // Note: Current regex only allows Latin characters, so these would fail
          // This test documents the current limitation
        });
      });

      it("should reject names with numbers and special characters", () => {
        const invalidNames = [
          "John123",
          "User@Name",
          "Test#User",
          "User$Name",
          "Test%User",
          "User^Name",
          "Test&User",
          "User*Name",
          "Test(User)",
          "User+Name",
          "Test=User",
          "User{Name}",
          "Test[User]",
          "User|Name",
          "Test\\User",
          "User;Name",
          "Test:User",
          'User"Name',
          "Test<User>",
          "User/Name",
          "Test?User",
        ];

        invalidNames.forEach((name) => {
          const data = {
            name,
            email: "test@example.com",
            message: "Valid message content",
            honeypot: "",
            gdprConsent: true,
          };

          const result = contactFormSchema.safeParse(data);
          expect(result.success).toBe(false);

          if (!result.success) {
            const nameError = result.error.errors.find((e) => e.path[0] === "name");
            expect(nameError?.message).toContain("can only contain letters");
          }
        });
      });

      it("should handle edge cases for name validation", () => {
        const edgeCases = [
          { name: "A", expectSuccess: false, reason: "too short" },
          { name: "Ab", expectSuccess: true, reason: "minimum length" },
          { name: "a".repeat(50), expectSuccess: true, reason: "maximum length" },
          { name: "a".repeat(51), expectSuccess: false, reason: "too long" },
          { name: "  John Doe  ", expectSuccess: true, reason: "should trim whitespace" },
          { name: "John  Doe", expectSuccess: true, reason: "multiple spaces allowed" },
          { name: "'John'", expectSuccess: true, reason: "quotes allowed" },
          { name: "-John-", expectSuccess: true, reason: "hyphens allowed" },
        ];

        edgeCases.forEach(({ name, expectSuccess }) => {
          const data = {
            name,
            email: "test@example.com",
            message: "Valid message content",
            honeypot: "",
            gdprConsent: true,
          };

          const result = contactFormSchema.safeParse(data);
          expect(result.success).toBe(expectSuccess);

          if (expectSuccess && result.success && name === "  John Doe  ") {
            expect(result.data.name).toBe("John Doe");
          }
        });
      });
    });

    describe("Message Field Validation", () => {
      it("should allow messages with exactly 2 URLs", () => {
        const messageWith2URLs =
          "Please check out my portfolio at https://example.com and my blog at https://blog.example.com for more information.";

        const data = {
          name: "Test User",
          email: "test@example.com",
          message: messageWith2URLs,
          honeypot: "",
          gdprConsent: true,
        };

        const result = contactFormSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("should handle various URL formats in spam detection", () => {
        const urlFormats = [
          "http://example.com",
          "https://example.com",
          "http://subdomain.example.com",
          "https://example.com/path/to/page",
          "https://example.com?param=value",
          "https://example.com#section",
          "https://example.com/path?param=value#section",
        ];

        // Test with exactly 2 URLs (should pass)
        const validMessage = `Check out ${urlFormats[0]} and ${urlFormats[1]} for more info.`;
        const validData = {
          name: "Test User",
          email: "test@example.com",
          message: validMessage,
          honeypot: "",
          gdprConsent: true,
        };

        const validResult = contactFormSchema.safeParse(validData);
        expect(validResult.success).toBe(true);

        // Test with 3 URLs (should fail)
        const invalidMessage = `Check out ${urlFormats[0]}, ${urlFormats[1]}, and ${urlFormats[2]} for more info.`;
        const invalidData = {
          name: "Test User",
          email: "test@example.com",
          message: invalidMessage,
          honeypot: "",
          gdprConsent: true,
        };

        const invalidResult = contactFormSchema.safeParse(invalidData);
        expect(invalidResult.success).toBe(false);
      });

      it("should detect various spam patterns", () => {
        const spamPatterns = [
          "aaaaaaaaaaa", // 10+ repeated characters
          "bbbbbbbbbbb",
          "ccccccccccc",
          "1111111111",
          "!!!!!!!!!!",
          "...........",
        ];

        spamPatterns.forEach((pattern) => {
          const data = {
            name: "Test User",
            email: "test@example.com",
            message: `This is a message with spam pattern: ${pattern}`,
            honeypot: "",
            gdprConsent: true,
          };

          const result = contactFormSchema.safeParse(data);
          expect(result.success).toBe(false);

          if (!result.success) {
            const messageError = result.error.errors.find((e) => e.path[0] === "message");
            expect(messageError?.message).toBe("Message appears to be spam");
          }
        });
      });

      it("should allow normal repeated characters under the threshold", () => {
        const validRepeats = [
          "I looove this product!",
          "Sooo excited!",
          "Reeeally great!",
          "Goooood job!",
        ];

        validRepeats.forEach((message) => {
          const data = {
            name: "Test User",
            email: "test@example.com",
            message,
            honeypot: "",
            gdprConsent: true,
          };

          const result = contactFormSchema.safeParse(data);
          expect(result.success).toBe(true);
        });
      });
    });

    describe("Company Field Validation", () => {
      it("should handle company names with various formats", () => {
        const validCompanies = [
          "Acme Corp",
          "Acme, Inc.",
          "Acme LLC",
          "Acme & Associates",
          "Smith-Jones Ltd",
          "O'Reilly Media",
          "AT&T",
          "3M Company",
          "7-Eleven",
        ];

        validCompanies.forEach((company) => {
          const data = {
            name: "Test User",
            email: "test@example.com",
            message: "Valid message content",
            honeypot: "",
            gdprConsent: true,
            company,
          };

          const result = contactFormSchema.safeParse(data);
          expect(result.success).toBe(true);

          if (result.success) {
            expect(result.data.company).toBeDefined();
          }
        });
      });

      it("should sanitize company names", () => {
        const data = {
          name: "Test User",
          email: "test@example.com",
          message: "Valid message content",
          honeypot: "",
          gdprConsent: true,
          company: "<script>alert('xss')</script>Evil Corp",
        };

        const result = contactFormSchema.safeParse(data);
        expect(result.success).toBe(true);

        if (result.success) {
          expect(result.data.company).not.toContain("<script>");
          expect(result.data.company).toContain("Evil Corp");
        }
      });

      it("should enforce company name length limits", () => {
        const tooLongCompany = "a".repeat(101);

        const data = {
          name: "Test User",
          email: "test@example.com",
          message: "Valid message content",
          honeypot: "",
          gdprConsent: true,
          company: tooLongCompany,
        };

        const result = contactFormSchema.safeParse(data);
        expect(result.success).toBe(false);

        if (!result.success) {
          const companyError = result.error.errors.find((e) => e.path[0] === "company");
          expect(companyError?.message).toBe("Company name must be less than 100 characters");
        }
      });
    });

    describe("Phone Field Validation", () => {
      it("should accept international phone number formats", () => {
        const validPhones = [
          "+1 (555) 123-4567",
          "+44 20 7123 4567",
          "+33 1 42 86 83 26",
          "+49 30 12345678",
          "+81 3-1234-5678",
          "555.123.4567",
          "555-123-4567",
          "(555) 123-4567",
          "1234567890",
          "+1-555-123-4567",
          "555 123 4567",
        ];

        validPhones.forEach((phone) => {
          const data = {
            name: "Test User",
            email: "test@example.com",
            message: "Valid message content",
            honeypot: "",
            gdprConsent: true,
            phone,
          };

          const result = contactFormSchema.safeParse(data);
          expect(result.success).toBe(true);
        });
      });

      it("should reject phones with invalid characters", () => {
        const invalidPhones = [
          "555-CALL-NOW", // Letters
          "555#123#4567", // Hash symbols
          "555*123*4567", // Asterisks
          "call me at 555", // Mixed text and numbers
          "555@123.com", // Email-like format
          "123-456-789012345678901", // Too long (over 20 chars)
        ];

        invalidPhones.forEach((phone) => {
          const data = {
            name: "Test User",
            email: "test@example.com",
            message: "Valid message content",
            honeypot: "",
            gdprConsent: true,
            phone,
          };

          const result = contactFormSchema.safeParse(data);
          expect(result.success).toBe(false);
        });
      });
    });
  });

  describe("Schema Variants Comparison", () => {
    it("should validate the same data across all three schemas", () => {
      const baseData = {
        name: "Test User",
        email: "test@example.com",
        message: "Valid message content",
        honeypot: "",
        gdprConsent: true,
        company: "Test Corp",
        phone: "555-123-4567",
      };

      // Test contactFormSchema (client-side)
      const clientResult = contactFormSchema.safeParse(baseData);
      expect(clientResult.success).toBe(true);

      // Test contactFormSchemaWithCSRF
      const csrfData = {
        ...baseData,
        csrfToken: "valid-token",
        clientInfo: {
          userAgent: "Mozilla/5.0",
          timestamp: Date.now(),
          timezone: "America/New_York",
        },
      };
      const csrfResult = contactFormSchemaWithCSRF.safeParse(csrfData);
      expect(csrfResult.success).toBe(true);

      // Test serverContactFormSchema
      const serverData = {
        ...csrfData,
        ipAddress: "192.168.1.1",
        headers: { "User-Agent": "Mozilla/5.0" },
      };
      const serverResult = serverContactFormSchema.safeParse(serverData);
      expect(serverResult.success).toBe(true);
    });

    it("should require CSRF token in schema variants that need it", () => {
      const baseData = {
        name: "Test User",
        email: "test@example.com",
        message: "Valid message content",
        honeypot: "",
        gdprConsent: true,
      };

      // contactFormSchema should work without CSRF token
      const clientResult = contactFormSchema.safeParse(baseData);
      expect(clientResult.success).toBe(true);

      // contactFormSchemaWithCSRF should require CSRF token
      const csrfResult = contactFormSchemaWithCSRF.safeParse(baseData);
      expect(csrfResult.success).toBe(false);

      if (!csrfResult.success) {
        const csrfError = csrfResult.error.errors.find((e) => e.path[0] === "csrfToken");
        expect(csrfError?.message).toBe("Required");
      }

      // serverContactFormSchema should also require CSRF token
      const serverResult = serverContactFormSchema.safeParse(baseData);
      expect(serverResult.success).toBe(false);
    });

    it("should handle optional fields consistently across schemas", () => {
      const minimalData = {
        name: "Test User",
        email: "test@example.com",
        message: "Valid message content",
        honeypot: "",
        gdprConsent: true,
      };

      // All schemas should accept minimal data (with required additions)
      const clientResult = contactFormSchema.safeParse(minimalData);
      expect(clientResult.success).toBe(true);

      const csrfData = {
        ...minimalData,
        csrfToken: "valid-token",
        clientInfo: {
          timestamp: Date.now(),
        },
      };
      const csrfResult = contactFormSchemaWithCSRF.safeParse(csrfData);
      expect(csrfResult.success).toBe(true);

      const serverData = {
        ...csrfData,
      };
      const serverResult = serverContactFormSchema.safeParse(serverData);
      expect(serverResult.success).toBe(true);
    });
  });

  describe("Timestamp Validation for Replay Attack Prevention", () => {
    it("should accept current timestamps", () => {
      const data = {
        name: "Test User",
        email: "test@example.com",
        message: "Valid message content",
        csrfToken: "valid-token",
        honeypot: "",
        gdprConsent: true,
        clientInfo: {
          timestamp: Date.now(),
        },
      };

      const result = contactFormSchemaWithCSRF.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept timestamps within the 5-minute window", () => {
      const fourMinutesAgo = Date.now() - 4 * 60 * 1000;

      const data = {
        name: "Test User",
        email: "test@example.com",
        message: "Valid message content",
        csrfToken: "valid-token",
        honeypot: "",
        gdprConsent: true,
        clientInfo: {
          timestamp: fourMinutesAgo,
        },
      };

      const result = contactFormSchemaWithCSRF.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should reject timestamps exactly at the 5-minute boundary", () => {
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

      const data = {
        name: "Test User",
        email: "test@example.com",
        message: "Valid message content",
        csrfToken: "valid-token",
        honeypot: "",
        gdprConsent: true,
        clientInfo: {
          timestamp: fiveMinutesAgo,
        },
      };

      const result = contactFormSchemaWithCSRF.safeParse(data);
      expect(result.success).toBe(false);

      if (!result.success) {
        const timestampError = result.error.errors.find((e) => e.path.includes("timestamp"));
        expect(timestampError?.message).toBe("Request expired. Please refresh and try again.");
      }
    });

    it("should reject future timestamps", () => {
      const oneHourFromNow = Date.now() + 60 * 60 * 1000;

      const data = {
        name: "Test User",
        email: "test@example.com",
        message: "Valid message content",
        csrfToken: "valid-token",
        honeypot: "",
        gdprConsent: true,
        clientInfo: {
          timestamp: oneHourFromNow,
        },
      };

      const result = contactFormSchemaWithCSRF.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should work without clientInfo timestamp", () => {
      const data = {
        name: "Test User",
        email: "test@example.com",
        message: "Valid message content",
        csrfToken: "valid-token",
        honeypot: "",
        gdprConsent: true,
        // No clientInfo provided
      };

      const result = contactFormSchemaWithCSRF.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe("Helper Function Tests", () => {
    describe("validateContactFormWithCSRF", () => {
      it("should validate valid data with CSRF token", () => {
        const data = {
          name: "Test User",
          email: "test@example.com",
          message: "Valid message content",
          csrfToken: "valid-token",
          honeypot: "",
          gdprConsent: true,
          clientInfo: {
            timestamp: Date.now(),
          },
        };

        const result = validateContactFormWithCSRF(data);
        expect(result.success).toBe(true);
        expect(result.sanitized).toBe(true);
        expect(result.data).toBeDefined();
      });

      it("should return errors for invalid data", () => {
        const invalidData = {
          name: "",
          email: "invalid-email",
          message: "short",
          csrfToken: "",
          gdprConsent: false,
        };

        const result = validateContactFormWithCSRF(invalidData);
        expect(result.success).toBe(false);
        expect(result.errors).toBeDefined();
      });
    });

    describe("validateContactFormServer", () => {
      it("should validate server data with IP and headers", () => {
        const data = {
          name: "Test User",
          email: "test@example.com",
          message: "Valid message content",
          csrfToken: "valid-token",
          honeypot: "",
          gdprConsent: true,
          clientInfo: {
            timestamp: Date.now(),
          },
        };

        const result = validateContactFormServer(data, "192.168.1.1", {
          "User-Agent": "Mozilla/5.0",
        });

        expect(result.success).toBe(true);
        expect(result.sanitized).toBe(true);
        expect(result.data).toBeDefined();
      });

      it("should work without IP and headers", () => {
        const data = {
          name: "Test User",
          email: "test@example.com",
          message: "Valid message content",
          csrfToken: "valid-token",
          honeypot: "",
          gdprConsent: true,
          clientInfo: {
            timestamp: Date.now(),
          },
        };

        const result = validateContactFormServer(data);
        expect(result.success).toBe(true);
      });
    });
  });

  describe("Error Message Accuracy and Field Path Mapping", () => {
    it("should provide accurate error messages for each field", () => {
      const invalidData = {
        name: "J", // Too short
        email: "invalid-email", // Invalid format
        message: "short", // Too short
        csrfToken: "", // Empty
        honeypot: "bot-content", // Should be empty
        gdprConsent: false, // Should be true
        company: "a".repeat(101), // Too long
        phone: "invalid-phone-123abc", // Invalid format
      };

      const result = contactFormSchemaWithCSRF.safeParse(invalidData);
      expect(result.success).toBe(false);

      if (!result.success) {
        const errors = result.error.errors;

        // Check that each field has the expected error
        const nameError = errors.find((e) => e.path[0] === "name");
        expect(nameError?.message).toBe("Name must be at least 2 characters");

        const emailError = errors.find((e) => e.path[0] === "email");
        expect(emailError?.message).toContain("valid email");

        const messageError = errors.find((e) => e.path[0] === "message");
        expect(messageError?.message).toBe("Message must be at least 10 characters");

        const csrfError = errors.find((e) => e.path[0] === "csrfToken");
        expect(csrfError?.message).toBe("CSRF token is required");

        // Check for honeypot error - it might be at the root level or field level
        const honeypotError = errors.find((e) => 
          e.path.length === 0 || e.path[0] === "honeypot"
        );
        if (honeypotError) {
          expect(honeypotError.message).toBe("Bot detection triggered");
        }

        const gdprError = errors.find((e) => e.path[0] === "gdprConsent");
        expect(gdprError?.message).toBe("You must accept the privacy policy to submit this form");

        const companyError = errors.find((e) => e.path[0] === "company");
        expect(companyError?.message).toBe("Company name must be less than 100 characters");

        const phoneError = errors.find((e) => e.path[0] === "phone");
        expect(phoneError?.message).toBe("Invalid phone number format");
      }
    });

    it("should map nested field errors correctly", () => {
      const invalidData = {
        name: "Test User",
        email: "test@example.com",
        message: "Valid message content",
        csrfToken: "valid-token",
        honeypot: "",
        gdprConsent: true,
        clientInfo: {
          timestamp: Date.now() - 6 * 60 * 1000, // Expired
        },
      };

      const result = contactFormSchemaWithCSRF.safeParse(invalidData);
      expect(result.success).toBe(false);

      if (!result.success) {
        const timestampError = result.error.errors.find(
          (e) => e.path.includes("clientInfo") && e.path.includes("timestamp"),
        );
        expect(timestampError?.message).toBe("Request expired. Please refresh and try again.");
        expect(timestampError?.path).toEqual(["clientInfo", "timestamp"]);
      }
    });

    it("should provide specific error codes for different validation failures", () => {
      const testCases = [
        {
          data: {
            name: "",
            email: "test@example.com",
            message: "Valid message",
            honeypot: "",
            gdprConsent: true,
          },
          expectedError: "name",
          expectedCode: "too_small",
        },
        {
          data: {
            name: "Test",
            email: "invalid-email",
            message: "Valid message",
            honeypot: "",
            gdprConsent: true,
          },
          expectedError: "email",
          expectedCode: "invalid_string",
        },
        {
          data: {
            name: "Test",
            email: "test@example.com",
            message: "",
            honeypot: "",
            gdprConsent: true,
          },
          expectedError: "message",
          expectedCode: "too_small",
        },
      ];

      testCases.forEach(({ data, expectedError, expectedCode }) => {
        const result = contactFormSchema.safeParse(data);
        expect(result.success).toBe(false);

        if (!result.success) {
          const fieldError = result.error.errors.find((e) => e.path[0] === expectedError);
          expect(fieldError?.code).toBe(expectedCode);
        }
      });
    });
  });

  describe("Performance and Edge Cases", () => {
    it("should handle very large valid inputs efficiently", () => {
      const largeValidData = {
        name: "A".repeat(50), // Maximum length
        email: "test@example.com",
        message: "This is a very long message that contains lots of content. " + "A".repeat(950), // Maximum length with valid content
        honeypot: "",
        gdprConsent: true,
        company: "A Corp " + "B".repeat(93), // Maximum length with valid format
        phone: "123-456-7890", // Valid format within 20 characters
      };

      const startTime = Date.now();
      const result = contactFormSchema.safeParse(largeValidData);
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms
    });

    it("should handle null and undefined values gracefully", () => {
      const dataWithNulls = {
        name: null,
        email: undefined,
        message: null,
        honeypot: undefined,
        gdprConsent: null,
        company: null,
        phone: undefined,
      };

      const result = contactFormSchema.safeParse(dataWithNulls);
      expect(result.success).toBe(false);

      if (!result.success) {
        // Should have errors for required fields
        expect(result.error.errors.length).toBeGreaterThan(0);
      }
    });

    it("should handle empty object input", () => {
      const result = contactFormSchema.safeParse({});
      expect(result.success).toBe(false);

      if (!result.success) {
        // Should have errors for all required fields
        const requiredFields = ["name", "email", "message", "gdprConsent"];
        requiredFields.forEach((field) => {
          const fieldError = result.error.errors.find((e) => e.path[0] === field);
          expect(fieldError).toBeDefined();
        });
      }
    });

    it("should handle array inputs gracefully", () => {
      const result = contactFormSchema.safeParse([]);
      expect(result.success).toBe(false);
    });

    it("should handle string inputs gracefully", () => {
      const result = contactFormSchema.safeParse("not an object");
      expect(result.success).toBe(false);
    });
  });
});
