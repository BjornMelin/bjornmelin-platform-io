import type { ContactFormData, ContactFormWithSecurityData } from "@/lib/schemas/contact";

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
    formLoadTime: Date.now() - 5000, // 5 seconds ago (valid timing)
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
  tooFast: () => buildContactFormWithSecurity({ formLoadTime: Date.now() - 100 }), // 100ms (too fast)
};
