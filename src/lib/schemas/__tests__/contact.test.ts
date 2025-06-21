import { describe, expect, it } from "vitest";
import { contactFormSchema } from "../contact";

describe("Contact Form Schema Validation", () => {
  describe("valid inputs", () => {
    it("validates a complete valid form submission", () => {
      const validData = {
        name: "John Doe",
        email: "john.doe@example.com",
        message: "This is a test message with more than 10 characters",
        honeypot: "",
        gdprConsent: true,
      };

      const result = contactFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it("allows names with apostrophes and hyphens", () => {
      const validData = {
        name: "Mary-Jane O'Brien",
        email: "mary@example.com",
        message: "This is a test message",
        honeypot: "",
        gdprConsent: true,
      };

      const result = contactFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("allows plus sign in email", () => {
      const validData = {
        name: "Test User",
        email: "test+filter@example.com",
        message: "This is a test message with special email",
        honeypot: "",
        gdprConsent: true,
      };

      const result = contactFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("allows maximum length message", () => {
      const longMessage = "a".repeat(1000);
      const validData = {
        name: "Test User",
        email: "test@example.com",
        message: longMessage,
        honeypot: "",
        gdprConsent: true,
      };

      const result = contactFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe("invalid inputs", () => {
    it("rejects name that is too short", () => {
      const invalidData = {
        name: "J",
        email: "john@example.com",
        message: "This is a test message",
        honeypot: "",
        gdprConsent: true,
      };

      const result = contactFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        const nameError = result.error.errors.find(e => e.path[0] === "name");
        expect(nameError?.message).toBe("Name must be at least 2 characters");
      }
    });

    it("rejects name that is too long", () => {
      const invalidData = {
        name: "a".repeat(51),
        email: "john@example.com",
        message: "This is a test message",
        honeypot: "",
        gdprConsent: true,
      };

      const result = contactFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        const nameError = result.error.errors.find(e => e.path[0] === "name");
        expect(nameError?.message).toBe("Name must be less than 50 characters");
      }
    });

    it("rejects invalid email format", () => {
      const invalidEmails = [
        "notanemail",
        "@example.com",
        "test@",
        "test..double@example.com",
        "test@example",
        "test @example.com",
        "test@exam ple.com"
      ];

      invalidEmails.forEach(email => {
        const invalidData = {
          name: "Test User",
          email,
          message: "This is a test message",
          honeypot: "",
          gdprConsent: true,
        };

        const result = contactFormSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        
        if (!result.success) {
          const emailError = result.error.errors.find(e => e.path[0] === "email");
          expect(emailError?.message).toBe("Please enter a valid email address");
        }
      });
    });

    it("rejects message that is too short", () => {
      const invalidData = {
        name: "Test User",
        email: "test@example.com",
        message: "Too short",
        honeypot: "",
        gdprConsent: true,
      };

      const result = contactFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        const messageError = result.error.errors.find(e => e.path[0] === "message");
        expect(messageError?.message).toBe("Message must be at least 10 characters");
      }
    });

    it("rejects message that is too long", () => {
      const invalidData = {
        name: "Test User",
        email: "test@example.com",
        message: "a".repeat(1001),
        honeypot: "",
        gdprConsent: true,
      };

      const result = contactFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        const messageError = result.error.errors.find(e => e.path[0] === "message");
        expect(messageError?.message).toBe("Message must be less than 1000 characters");
      }
    });

    it("rejects when GDPR consent is false", () => {
      const invalidData = {
        name: "Test User",
        email: "test@example.com",
        message: "This is a test message",
        honeypot: "",
        gdprConsent: false,
      };

      const result = contactFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        const gdprError = result.error.errors.find(e => e.path[0] === "gdprConsent");
        expect(gdprError?.message).toBe("You must accept the privacy policy to submit this form");
      }
    });
  });

  describe("missing fields", () => {
    it("requires all fields except honeypot", () => {
      const incompleteData = {
        honeypot: "",
      };

      const result = contactFormSchema.safeParse(incompleteData);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        const errors = result.error.errors;
        const fields = errors.map(e => e.path[0]);
        
        expect(fields).toContain("name");
        expect(fields).toContain("email");
        expect(fields).toContain("message");
        expect(fields).toContain("gdprConsent");
      }
    });

    it("allows missing honeypot field", () => {
      const dataWithoutHoneypot = {
        name: "Test User",
        email: "test@example.com",
        message: "This is a test message",
        gdprConsent: true,
      };

      const result = contactFormSchema.safeParse(dataWithoutHoneypot);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.honeypot).toBeUndefined();
      }
    });
  });

  describe("edge cases", () => {
    it("rejects names with invalid characters", () => {
      const invalidNames = [
        "John123",
        "John@Doe",
        "José García", // International characters not allowed
        "John_Doe",
        "John.Doe"
      ];

      invalidNames.forEach(name => {
        const invalidData = {
          name,
          email: "test@example.com",
          message: "This is a test message",
          honeypot: "",
          gdprConsent: true,
        };

        const result = contactFormSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        
        if (!result.success) {
          const nameError = result.error.errors.find(e => e.path[0] === "name");
          expect(nameError?.message).toBe("Name can only contain letters, spaces, hyphens, and apostrophes");
        }
      });
    });

    it("handles empty string for honeypot", () => {
      const validData = {
        name: "Test User",
        email: "test@example.com",
        message: "This is a test message",
        honeypot: "",
        gdprConsent: true,
      };

      const result = contactFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("rejects non-string types for text fields", () => {
      const invalidData = {
        name: 123,
        email: { email: "test@example.com" },
        message: ["This is a test message"],
        honeypot: "",
        gdprConsent: true,
      };

      const result = contactFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("rejects non-boolean for gdprConsent", () => {
      const invalidData = {
        name: "Test User",
        email: "test@example.com",
        message: "This is a test message",
        honeypot: "",
        gdprConsent: "true",
      };

      const result = contactFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});