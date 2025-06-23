import DOMPurify from "isomorphic-dompurify";
import { z } from "zod";

/**
 * Contact form validation schema with security features
 */

// Custom sanitization function for text inputs
const sanitizeText = (text: string): string => {
  // Remove any HTML tags and dangerous characters
  const cleaned = DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
  // Additional cleanup for common XSS patterns
  return cleaned
    .replace(/[<>]/g, "") // Remove angle brackets
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, "") // Remove event handlers
    .trim();
};

// Name validation
const nameSchema = z
  .string()
  .min(2, "Name must be at least 2 characters")
  .max(50, "Name must be less than 50 characters")
  .regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes")
  .transform(sanitizeText)
  .refine(
    (name) => !/(script|select|union|insert|update|delete|drop)/i.test(name),
    "Invalid characters detected in name",
  );

// Email validation with additional checks
const emailSchema = z
  .string()
  .email("Please enter a valid email address")
  .min(5, "Email must be at least 5 characters")
  .max(254, "Email must be less than 254 characters")
  .toLowerCase()
  .transform((email) => email.trim())
  .refine((email) => {
    // Additional email validation
    const parts = email.split("@");
    if (parts.length !== 2) return false;

    const [local, domain] = parts;

    // Check local part
    if (local.length > 64) return false;
    if (local.startsWith(".") || local.endsWith(".")) return false;
    if (local.includes("..")) return false;

    // Check domain
    if (domain.length > 253) return false;
    if (!domain.includes(".")) return false;
    if (domain.startsWith(".") || domain.endsWith(".")) return false;

    return true;
  }, "Invalid email format")
  .refine((email) => {
    // Block disposable email domains (basic list)
    const disposableDomains = [
      "tempmail.com",
      "throwaway.email",
      "guerrillamail.com",
      "mailinator.com",
      "10minutemail.com",
    ];
    const domain = email.split("@")[1];
    return !disposableDomains.includes(domain);
  }, "Disposable email addresses are not allowed");

// Message validation with content filtering
const messageSchema = z
  .string()
  .min(10, "Message must be at least 10 characters")
  .max(1000, "Message must be less than 1000 characters")
  .transform(sanitizeText)
  .refine((message) => {
    // Check for SQL injection patterns
    const sqlPatterns = /(\b(union|select|insert|update|delete|drop|create|alter|exec|script)\b)/i;
    return !sqlPatterns.test(message);
  }, "Message contains invalid content")
  .refine((message) => {
    // Check for excessive URLs (spam indicator)
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    const urls = message.match(urlPattern) || [];
    return urls.length <= 2; // Allow max 2 URLs
  }, "Too many URLs detected. Maximum 2 URLs allowed.")
  .refine((message) => {
    // Check for repeated characters (spam indicator)
    const repeatedChars = /(.)\1{9,}/;
    return !repeatedChars.test(message);
  }, "Message appears to be spam");

// Client-side contact form schema (without CSRF token - handled in headers)
export const contactFormSchema = z
  .object({
    // Core fields with enhanced validation
    name: nameSchema,
    email: emailSchema,
    message: messageSchema,

    // Security fields
    honeypot: z.string().optional().default(""),

    // GDPR compliance
    gdprConsent: z
      .boolean({
        required_error: "You must accept the privacy policy to submit this form",
      })
      .refine((value) => value === true, {
        message: "You must accept the privacy policy to submit this form",
      }),

    // Optional fields
    company: z
      .string()
      .max(100, "Company name must be less than 100 characters")
      .transform(sanitizeText)
      .optional(),
    phone: z
      .string()
      .regex(/^[\d\s+().-]+$/, "Invalid phone number format")
      .max(20, "Phone number must be less than 20 characters")
      .optional(),
  })
  .refine((data) => !data.honeypot || data.honeypot === "", {
    message: "Bot detection triggered",
    path: ["honeypot"],
  });

// Full contact form schema with CSRF token for server-side validation
export const contactFormSchemaWithCSRF = z
  .object({
    // Core fields with enhanced validation
    name: nameSchema,
    email: emailSchema,
    message: messageSchema,

    // Security fields
    csrfToken: z.string().min(1, "CSRF token is required"),
    honeypot: z.string().optional().default(""),

    // GDPR compliance
    gdprConsent: z
      .boolean({
        required_error: "You must accept the privacy policy to submit this form",
      })
      .refine((value) => value === true, {
        message: "You must accept the privacy policy to submit this form",
      }),

    // Client information for rate limiting
    clientInfo: z
      .object({
        userAgent: z.string().optional(),
        timestamp: z.number(),
        timezone: z.string().optional(),
      })
      .optional(),

    // Optional fields
    company: z
      .string()
      .max(100, "Company name must be less than 100 characters")
      .transform(sanitizeText)
      .optional(),
    phone: z
      .string()
      .regex(/^[\d\s+().-]+$/, "Invalid phone number format")
      .max(20, "Phone number must be less than 20 characters")
      .optional(),
  })
  .refine((data) => !data.honeypot || data.honeypot === "", {
    message: "Bot detection triggered",
    path: ["honeypot"],
  })
  .refine(
    (data) => {
      // Additional timestamp validation (prevent replay attacks)
      if (data.clientInfo?.timestamp) {
        const now = Date.now();
        const diff = Math.abs(now - data.clientInfo.timestamp);
        // Reject if timestamp is more than 5 minutes old
        return diff < 5 * 60 * 1000;
      }
      return true;
    },
    {
      message: "Request expired. Please refresh and try again.",
      path: ["clientInfo", "timestamp"],
    },
  );

// Type exports
export type ContactFormData = z.infer<typeof contactFormSchema>;

// Server-side only validation (additional checks that shouldn't be exposed to client)
export const serverContactFormSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    message: messageSchema,

    // Security fields
    csrfToken: z.string().min(1, "CSRF token is required"),
    honeypot: z.string().optional().default(""),

    // GDPR compliance
    gdprConsent: z
      .boolean({
        required_error: "You must accept the privacy policy to submit this form",
      })
      .refine((value) => value === true, {
        message: "You must accept the privacy policy to submit this form",
      }),

    // Client information for rate limiting
    clientInfo: z
      .object({
        userAgent: z.string().optional(),
        timestamp: z.number(),
        timezone: z.string().optional(),
      })
      .optional(),

    // Optional fields
    company: z
      .string()
      .max(100, "Company name must be less than 100 characters")
      .transform(sanitizeText)
      .optional(),
    phone: z
      .string()
      .regex(/^[\d\s+().-]+$/, "Invalid phone number format")
      .max(20, "Phone number must be less than 20 characters")
      .optional(),

    // Server-side only fields
    ipAddress: z.string().optional(),
    headers: z.record(z.string()).optional(),
  })
  .refine((data) => !data.honeypot || data.honeypot === "", {
    message: "Bot detection triggered",
    path: ["honeypot"],
  })
  .refine(
    (data) => {
      // Additional timestamp validation (prevent replay attacks)
      if (data.clientInfo?.timestamp) {
        const now = Date.now();
        const diff = Math.abs(now - data.clientInfo.timestamp);
        // Reject if timestamp is more than 5 minutes old
        return diff < 5 * 60 * 1000;
      }
      return true;
    },
    {
      message: "Request expired. Please refresh and try again.",
      path: ["clientInfo", "timestamp"],
    },
  );

export type ServerContactFormData = z.infer<typeof serverContactFormSchema>;

// Validation result type
export interface ValidationResult {
  success: boolean;
  data?: ContactFormData;
  errors?: z.ZodError;
  sanitized?: boolean;
}

/**
 * Validate and sanitize contact form data (client-side)
 */
export function validateContactForm(data: unknown): ValidationResult {
  try {
    const validated = contactFormSchema.parse(data);
    return {
      success: true,
      data: validated,
      sanitized: true,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error,
      };
    }
    throw error;
  }
}

/**
 * Validate contact form data with CSRF token (for API endpoints)
 */
export function validateContactFormWithCSRF(data: unknown): ValidationResult {
  try {
    const validated = contactFormSchemaWithCSRF.parse(data);
    return {
      success: true,
      data: validated as ContactFormData, // Cast since it includes CSRF
      sanitized: true,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error,
      };
    }
    throw error;
  }
}

/**
 * Server-side validation with additional checks
 */
export function validateContactFormServer(
  data: unknown,
  ipAddress?: string,
  headers?: Record<string, string>,
): ValidationResult {
  try {
    const serverData = {
      ...(data as object),
      ipAddress,
      headers,
    };
    const validated = serverContactFormSchema.parse(serverData);
    return {
      success: true,
      data: validated as ContactFormData,
      sanitized: true,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error,
      };
    }
    throw error;
  }
}
