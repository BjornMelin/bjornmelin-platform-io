import { z } from "zod";

/**
 * Base contact form fields (name, email, message).
 */
const baseContactFields = {
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters"),
  email: z.string().email("Please enter a valid email address"),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(1000, "Message must be less than 1000 characters"),
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
