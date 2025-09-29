import { NextResponse } from "next/server";
import { contactFormSchema } from "@/lib/schemas/contact";
import { EmailService } from "@/lib/services/email";
import { APIError, handleAPIError } from "@/lib/utils/error-handler";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = contactFormSchema.parse(body);

    const emailService = EmailService.getInstance();
    await emailService.sendContactFormEmail(validatedData);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes("send email")) {
      throw new APIError(
        "Failed to send message. Please try again later.",
        500,
        "EMAIL_SEND_ERROR",
      );
    }
    return handleAPIError(error);
  }
}
