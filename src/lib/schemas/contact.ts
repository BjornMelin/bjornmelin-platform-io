import { z } from "zod";
import { CONTACT_FORM_LIMITS } from "../email/templates/contact-form";

const { name: nameLimits, message: msgLimits } = CONTACT_FORM_LIMITS;

/**
 * Base contact form fields (name, email, message).
 * Uses shared validation limits from email templates module.
 */
const baseContactFields = {
  name: z
    .string()
    .trim()
    .min(nameLimits.min, { error: `Name must be at least ${nameLimits.min} characters` })
    .max(nameLimits.max, { error: `Name must be less than ${nameLimits.max} characters` })
    .describe("User's full name"),
  email: z
    .email({ error: "Please enter a valid email address" })
    .describe("Valid email address for contact response"),
  message: z
    .string()
    .trim()
    .min(msgLimits.min, { error: `Message must be at least ${msgLimits.min} characters` })
    .max(msgLimits.max, { error: `Message must be less than ${msgLimits.max} characters` })
    .describe("Contact message content"),
};

/**
 * Contact form schema for client-side validation.
 * Includes only the visible form fields.
 * Uses looseObject to allow additional fields from form submission.
 */
export const contactFormSchema = z.looseObject(baseContactFields);

/**
 * Extended contact form schema including abuse prevention fields.
 * Used for server-side validation with honeypot and timing checks.
 * Uses strictObject to reject unexpected fields for security.
 */
export const contactFormWithSecuritySchema = z.strictObject({
  ...baseContactFields,
  /** Honeypot field - must be empty (bots fill this) */
  honeypot: z.string().length(0, { error: "Invalid submission" }).optional(),
  /** Timestamp when form was loaded (for timing validation) */
  formLoadTime: z.number().int().optional().describe("Form load timestamp in milliseconds"),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;
export type ContactFormWithSecurityData = z.infer<typeof contactFormWithSecuritySchema>;
