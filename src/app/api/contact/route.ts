import { NextResponse } from "next/server";
import { contactFormSchema } from "@/lib/schemas/contact";
import {
  ResendEmailError,
  ResendEmailService,
  ResendRateLimitError,
} from "@/lib/services/resend-email";
import { APIError, handleAPIError } from "@/lib/utils/error-handler";
import { checkRateLimit, getClientIp, sanitizeInput } from "@/lib/utils/security";

export async function POST(request: Request) {
  try {
    // Get client IP for rate limiting
    const clientIp = getClientIp(request);

    // Check rate limit
    const { allowed, remaining, resetTime } = checkRateLimit(clientIp);

    if (!allowed) {
      return NextResponse.json(
        {
          error: "Too many requests. Please try again later.",
          code: "RATE_LIMIT_EXCEEDED",
          resetTime: new Date(resetTime).toISOString(),
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": "5",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": resetTime.toString(),
          },
        },
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: "Invalid JSON in request body",
          code: "INVALID_REQUEST",
        },
        { status: 400 },
      );
    }

    // Type guard for body
    if (typeof body !== "object" || body === null) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          code: "INVALID_REQUEST",
        },
        { status: 400 },
      );
    }

    const requestData = body as Record<string, unknown>;

    // Check honeypot field
    if (requestData.honeypot && requestData.honeypot !== "") {
      // Silently reject bot submissions
      return NextResponse.json({ success: true });
    }

    // Sanitize inputs before validation
    const sanitizedData = {
      ...requestData,
      name:
        typeof requestData.name === "string" ? sanitizeInput(requestData.name) : requestData.name,
      email:
        typeof requestData.email === "string"
          ? sanitizeInput(requestData.email)
          : requestData.email,
      message:
        typeof requestData.message === "string"
          ? sanitizeInput(requestData.message)
          : requestData.message,
    };

    const validatedData = contactFormSchema.parse(sanitizedData);

    // Send email using Resend
    const resendService = ResendEmailService.getInstance();
    const result = await resendService.sendContactFormEmail(validatedData);

    return NextResponse.json(
      {
        success: true,
        emailId: result.id,
      },
      {
        headers: {
          "X-RateLimit-Limit": "5",
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": resetTime.toString(),
        },
      },
    );
  } catch (error) {
    // Handle specific Resend errors
    if (error instanceof ResendRateLimitError) {
      return handleAPIError(
        new APIError(
          "Email service rate limit exceeded. Please try again later.",
          429,
          "EMAIL_RATE_LIMIT",
        ),
      );
    }

    if (error instanceof ResendEmailError) {
      // Log the specific error for debugging
      console.error("ResendEmailError:", {
        code: error.code,
        statusCode: error.statusCode,
        message: error.message,
      });

      return handleAPIError(
        new APIError(
          "Failed to send message. Please try again later.",
          error.statusCode || 500,
          error.code || "EMAIL_SEND_ERROR",
        ),
      );
    }

    return handleAPIError(error);
  }
}
