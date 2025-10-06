import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
    server: {
        AWS_REGION: z.string().min(1),
        AWS_ACCESS_KEY_ID: z.string().min(1).optional(),
        AWS_SECRET_ACCESS_KEY: z.string().min(1).optional(),
        CONTACT_EMAIL: z.string().email().default("bjornmelin16@gmail.com"),
    },
    client: {
        NEXT_PUBLIC_APP_URL: z.string().min(1),
    },
    runtimeEnv: {
        AWS_REGION: process.env.AWS_REGION,
        AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
        AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
        CONTACT_EMAIL: process.env.CONTACT_EMAIL,
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    },
    skipValidation: !!process.env.SKIP_ENV_VALIDATION,
}); 
