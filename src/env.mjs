import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
    server: {
        // Email configuration
        RESEND_API_KEY: z.string().min(1), // Required for Resend
        RESEND_FROM_EMAIL: z.string().email().default("noreply@bjornmelin.io"),
        CONTACT_EMAIL: z.string().email().default("contact@bjornmelin.io"),
    },
    client: {
        NEXT_PUBLIC_APP_URL: z.string().min(1),
    },
    runtimeEnv: {
        RESEND_API_KEY: process.env.RESEND_API_KEY,
        RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
        CONTACT_EMAIL: process.env.CONTACT_EMAIL,
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    },
    skipValidation: !!process.env.SKIP_ENV_VALIDATION,
}); 