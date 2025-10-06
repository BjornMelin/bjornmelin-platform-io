import { NextResponse } from "next/server";
import { contactFormSchema } from "@/lib/schemas/contact";
import { EmailService } from "@/lib/services/email";
import { APIError, handleAPIError } from "@/lib/utils/error-handler";

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new APIError("Validation failed", 400, "INVALID_JSON");
    }

    const validatedData = contactFormSchema.parse(body);

    const emailService = EmailService.getInstance();
    try {
      await emailService.sendContactFormEmail(validatedData);
    } catch {
      return handleAPIError(
        new APIError("Failed to send message. Please try again later.", 500, "EMAIL_SEND_ERROR"),
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAPIError(error);
  }
}
