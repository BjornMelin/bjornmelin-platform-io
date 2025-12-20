import { NextResponse } from "next/server";
import { env } from "@/env.mjs";
import { sendContactEmail } from "@/lib/email";
import { contactFormWithSecuritySchema } from "@/lib/schemas/contact";
import { checkRateLimit, isHoneypotTriggered, isSubmissionTooFast } from "@/lib/security";
import { APIError, handleAPIError } from "@/lib/utils/error-handler";

// Cache validated CONTACT_EMAIL at module load
const CONTACT_EMAIL = env.CONTACT_EMAIL;

/**
 * Extracts the client IP address from the request headers.
 */
function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(request: Request) {
  try {
    // 1. Rate limiting check
    const ip = getClientIP(request);
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    // 2. Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new APIError("Validation failed", 400, "INVALID_JSON");
    }

    // 3. Validate with security schema
    const validatedData = contactFormWithSecuritySchema.parse(body);

    // 4. Honeypot check - silent success for bots
    if (isHoneypotTriggered(validatedData.honeypot)) {
      // Return success to avoid tipping off bots, but don't send email
      return NextResponse.json({ success: true });
    }

    // 5. Time-based check - reject submissions that are too fast
    if (validatedData.formLoadTime && isSubmissionTooFast(validatedData.formLoadTime)) {
      return NextResponse.json(
        { error: "Please take your time filling out the form." },
        { status: 400 },
      );
    }

    // 6. Send email via Resend
    try {
      await sendContactEmail({
        data: {
          name: validatedData.name,
          email: validatedData.email,
          message: validatedData.message,
        },
        from: env.EMAIL_FROM ?? "Contact Form <noreply@bjornmelin.io>",
        to: CONTACT_EMAIL,
      });
    } catch (error) {
      console.error("Email send error:", error);
      return handleAPIError(
        new APIError("Failed to send message. Please try again later.", 500, "EMAIL_SEND_ERROR"),
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAPIError(error);
  }
}
