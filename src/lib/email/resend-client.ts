import { Resend } from "resend";
import { env } from "@/env.mjs";

let resendClient: Resend | null = null;

/**
 * Returns a singleton Resend client instance.
 * Lazily initializes the client on first call.
 *
 * @returns Configured Resend client.
 * @throws {Error} When RESEND_API_KEY environment variable is not set.
 */
export function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY environment variable is required");
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}
