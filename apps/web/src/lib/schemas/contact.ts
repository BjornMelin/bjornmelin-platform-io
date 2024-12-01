import { z } from "zod";

export const contactFormSchema = z.object({
    name: z.string()
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name must be less than 100 characters")
        .trim(),
    email: z.string()
        .email("Please enter a valid email address")
        .min(5, "Email must be at least 5 characters")
        .max(254, "Email must be less than 254 characters")
        .trim()
        .toLowerCase(),
    message: z.string()
        .min(10, "Message must be at least 10 characters")
        .max(1000, "Message must be less than 1000 characters")
        .trim(),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;
