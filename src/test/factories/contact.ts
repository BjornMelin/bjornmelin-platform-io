import type { ContactFormData, ContactFormWithSecurityData } from "@/lib/schemas/contact";

const VALID_FORM_FILL_TIME_MS = 5_000; // Must be > MIN_SUBMISSION_TIME (3s) in src/lib/security/time-check.ts
const TOO_FAST_FORM_FILL_TIME_MS = 100;

/**
 * Build valid contact form data for tests.
 * Provides sensible defaults that pass validation.
 */
export function buildContactFormData(overrides: Partial<ContactFormData> = {}): ContactFormData {
  return {
    name: "Test User",
    email: "test@example.com",
    message: "This is a test message that meets the minimum length requirement for validation.",
    ...overrides,
  };
}

/**
 * Build contact form data with security fields for API testing.
 * Includes honeypot and formLoadTime fields.
 */
export function buildContactFormWithSecurity(
  overrides: Partial<ContactFormWithSecurityData> = {},
): ContactFormWithSecurityData {
  return {
    ...buildContactFormData(),
    honeypot: "", // Empty honeypot (valid)
    formLoadTime: Date.now() - VALID_FORM_FILL_TIME_MS,
    ...overrides,
  };
}

/**
 * Build invalid contact form data for error testing.
 */
export const invalidContactData = {
  nameTooShort: () => buildContactFormData({ name: "A" }),
  invalidEmail: () => buildContactFormData({ email: "not-an-email" }),
  messageTooShort: () => buildContactFormData({ message: "Hi" }),
  honeypotFilled: () => buildContactFormWithSecurity({ honeypot: "bot-filled" }),
  tooFast: () =>
    buildContactFormWithSecurity({ formLoadTime: Date.now() - TOO_FAST_FORM_FILL_TIME_MS }),
};
