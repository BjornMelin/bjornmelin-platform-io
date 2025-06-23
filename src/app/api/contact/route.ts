import { NextResponse } from "next/server";
import { contactFormSchema } from "@/lib/schemas/contact";
import { checkCSRFToken } from "@/lib/security/csrf";
import {
  applyRateLimit,
  createRateLimitResponse,
  getRateLimitHeaders,
} from "@/lib/security/rate-limiter";
import {
  ResendEmailError,
  ResendEmailService,
  ResendRateLimitError,
} from "@/lib/services/resend-email";
import { APIError, handleAPIError } from "@/lib/utils/error-handler";
import { sanitizeInput } from "@/lib/utils/security";
import {
  enhancedContactFormSchema,
  validateContactFormServer,
} from "@/lib/validation/contact-schema";

export async function POST(request: Request) {
  try {
    // Apply rate limiting first
    const rateLimitResult = applyRateLimit(request);

    if (!rateLimitResult.allowed) {
      return createRateLimitResponse();
    }

    // Check CSRF token
    const csrfCheck = await checkCSRFToken(request);
    if (!csrfCheck.valid) {
      return NextResponse.json(
        {
          error: csrfCheck.error || "Invalid CSRF token",
          code: "CSRF_VALIDATION_FAILED",
        },
        {
          status: 403,
          headers: getRateLimitHeaders(rateLimitResult),
        },
      );
    }

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: "Invalid JSON in request body",
          code: "INVALID_REQUEST",
        },
        {
          status: 400,
          headers: getRateLimitHeaders(rateLimitResult),
        },
      );
    }

    // Type guard for body
    if (typeof body !== "object" || body === null) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          code: "INVALID_REQUEST",
        },
        {
          status: 400,
          headers: getRateLimitHeaders(rateLimitResult),
        },
      );
    }

    const requestData = body as Record<string, unknown>;

    // Check honeypot field
    if (requestData.honeypot && requestData.honeypot !== "") {
      // Silently accept bot submissions but don't process them
      return NextResponse.json(
        { success: true },
        { headers: getRateLimitHeaders(rateLimitResult) },
      );
    }

    // Get client IP and headers for server validation
    const clientIP =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // Validate with enhanced schema
    const validationResult = validateContactFormServer(requestData, clientIP, headers);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          code: "VALIDATION_ERROR",
          details: validationResult.errors?.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        {
          status: 400,
          headers: getRateLimitHeaders(rateLimitResult),
        },
      );
    }

    const validatedData = validationResult.data!;

    // Send email using Resend
    const resendService = ResendEmailService.getInstance();
    const result = await resendService.sendContactFormEmail({
      name: validatedData.name,
      email: validatedData.email,
      message: validatedData.message,
      gdprConsent: validatedData.gdprConsent,
    });

    // Log successful submission (for monitoring)
    console.log("Contact form submission:", {
      timestamp: new Date().toISOString(),
      ip: clientIP,
      emailId: result.id,
      name: validatedData.name.substring(0, 3) + "***", // Partial name for privacy
    });

    return NextResponse.json(
      {
        success: true,
        emailId: result.id,
        message: "Thank you for your message. We'll be in touch soon!",
      },
      {
        headers: getRateLimitHeaders(rateLimitResult),
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

    // Generic error handling
    console.error("Contact form error:", error);
    return handleAPIError(error);
  }
}

// OPTIONS request for CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-CSRF-Token, X-Session-ID",
    },
  });
}
