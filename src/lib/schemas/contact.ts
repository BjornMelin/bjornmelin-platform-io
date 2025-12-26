import { z } from "zod";
import { CONTACT_FORM_LIMITS } from "@/lib/email/templates/contact-form";

const { name: nameLimits, message: msgLimits } = CONTACT_FORM_LIMITS;

/**
 * Base contact form fields (name, email, message).
 * Uses shared validation limits from email templates module.
 */
const baseContactFields = {
  name: z
    .string()
    .min(nameLimits.min, `Name must be at least ${nameLimits.min} characters`)
    .max(nameLimits.max, `Name must be less than ${nameLimits.max} characters`),
  email: z.string().email("Please enter a valid email address"),
  message: z
    .string()
    .min(msgLimits.min, `Message must be at least ${msgLimits.min} characters`)
    .max(msgLimits.max, `Message must be less than ${msgLimits.max} characters`),
};

/**
 * Contact form schema for client-side validation.
 * Includes only the visible form fields.
 */
export const contactFormSchema = z.object(baseContactFields);

/**
 * Extended contact form schema including abuse prevention fields.
 * Used for server-side validation with honeypot and timing checks.
 */
export const contactFormWithSecuritySchema = z.object({
  ...baseContactFields,
  /** Honeypot field - must be empty (bots fill this) */
  honeypot: z.string().max(0, "Invalid submission").optional(),
  /** Timestamp when form was loaded (for timing validation) */
  formLoadTime: z.number().optional(),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;
export type ContactFormWithSecurityData = z.infer<typeof contactFormWithSecuritySchema>;
