import { z } from "zod";

// Advanced Zod v3 schema with enhanced validation and security features
export const contactFormSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name must be less than 50 characters")
      .regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes")
      .transform((name) => name.trim()),
    email: z
      .string()
      .email("Please enter a valid email address")
      .min(5, "Email must be at least 5 characters")
      .max(254, "Email must be less than 254 characters")
      .toLowerCase()
      .transform((email) => email.trim()),
    message: z
      .string()
      .min(10, "Message must be at least 10 characters")
      .max(1000, "Message must be less than 1000 characters")
      .transform((message) => message.trim()),
    // Security fields
    honeypot: z.string().optional(),
    gdprConsent: z
      .boolean({
        required_error: "You must accept the privacy policy to submit this form",
      })
      .refine((value) => value === true, {
        message: "You must accept the privacy policy to submit this form",
      }),
    csrfToken: z.string().optional(),
    // Optional file attachment (for future use)
    attachment: z
      .instanceof(File)
      .optional()
      .refine((file) => !file || file.size <= 5 * 1024 * 1024, "File must be less than 5MB")
      .refine(
        (file) => !file || ["image/jpeg", "image/png", "application/pdf"].includes(file.type),
        "File must be JPEG, PNG, or PDF",
      ),
  })
  .refine((data) => !data.honeypot || data.honeypot === "", {
    message: "Bot detection triggered",
    path: ["honeypot"],
  });

export type ContactFormData = z.infer<typeof contactFormSchema>;
