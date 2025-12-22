import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { Resend } from "resend";
import {
  type ContactFormData,
  createContactEmailHtml,
  createContactEmailText,
  validateContactForm,
} from "../../../../src/lib/email/templates/contact-form";
import { getParameter } from "../../utils/ssm";

/**
 * Retrieves a required environment variable or throws when missing.
 */
const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
};

const domain = requireEnv("DOMAIN_NAME");

/**
 * Resolves the contact recipient email from AWS SSM Parameter Store.
 * Uses getParameter's internal 5-minute cache to handle secret rotation.
 */
async function resolveRecipientEmail(): Promise<string> {
  const paramName = requireEnv("SSM_RECIPIENT_EMAIL_PARAM");
  const value = await getParameter(paramName, true);
  if (!value) throw new Error("Contact recipient configuration error");
  return value;
}

/**
 * Extracts the Resend API key from SSM parameter value.
 * Supports both JSON format `{"apiKey":"re_xxx",...}` and plain string.
 */
function extractApiKey(rawValue: string): string {
  try {
    const parsed = JSON.parse(rawValue) as { apiKey?: unknown };
    if (typeof parsed.apiKey === "string" && parsed.apiKey) {
      return parsed.apiKey;
    }
  } catch {
    // Not JSON - fall through to return raw value
  }
  return rawValue;
}

/**
 * Gets a Resend client with API key from SSM.
 * Creates a new client on each call. Note: SSM values are cached for 5 minutes,
 * so key rotation takes effect within that window.
 */
async function getResendClient(): Promise<Resend> {
  const paramName = requireEnv("SSM_RESEND_API_KEY_PARAM");
  const rawValue = await getParameter(paramName, true);
  if (!rawValue) throw new Error("Email service configuration error");

  const apiKey = extractApiKey(rawValue);
  if (!apiKey) throw new Error("Email service configuration error");

  return new Resend(apiKey);
}

/**
 * Validates and sanitizes an email address to prevent header injection.
 * Returns null if the email is invalid or contains injection characters.
 */
function sanitizeEmail(email: string): string | null {
  // Check for header injection characters (CR, LF, null bytes)
  if (/[\r\n\0]/.test(email)) {
    return null;
  }
  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return null;
  }
  return email.trim();
}

/**
 * Parses allowed origins from environment variables.
 * Uses the already-validated domain constant instead of re-reading process.env.
 */
const parseAllowedOrigins = (domainName: string): string[] => {
  const origins = new Set<string>();

  // Parse CSV origins from ALLOWED_ORIGINS
  const csvOrigins = process.env.ALLOWED_ORIGINS;
  if (csvOrigins) {
    for (const origin of csvOrigins.split(",")) {
      const trimmed = origin.trim();
      if (trimmed) {
        origins.add(trimmed);
      }
    }
  }

  // Add single origin fallback
  const singleOrigin = process.env.ALLOWED_ORIGIN;
  if (singleOrigin) {
    origins.add(singleOrigin);
  }

  // Always include domain-based origins
  origins.add(`https://${domainName}`);
  origins.add(`https://www.${domainName}`);
  origins.add(`https://api.${domainName}`);

  return Array.from(origins);
};

const allowedOrigins = parseAllowedOrigins(domain);

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const origin = event.headers.origin || event.headers.Origin;

  const corsHeaders: {
    "Access-Control-Allow-Headers": string;
    "Access-Control-Allow-Methods": string;
    "Access-Control-Allow-Origin"?: string;
  } = {
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (origin) {
    if (allowedOrigins.includes(origin)) {
      corsHeaders["Access-Control-Allow-Origin"] = origin;
    } else {
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Forbidden" }),
      };
    }
  }

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: "",
    };
  }

  // Check for missing body before try block (client error, not server error)
  if (!event.body) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({
        error: "Invalid request",
        message: "Missing request body",
      }),
    };
  }

  try {
    const parsed: unknown = JSON.parse(event.body);
    const validationResult = validateContactForm(parsed as Record<string, unknown>);

    if (!validationResult.valid) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: validationResult.error }),
      };
    }

    // At this point, validation passed, so we can safely cast
    const data = parsed as ContactFormData;

    // Validate and sanitize email to prevent header injection
    const sanitizedEmail = sanitizeEmail(data.email);
    if (!sanitizedEmail) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Invalid email address format" }),
      };
    }

    // Get email recipient and Resend client
    const recipientEmail = await resolveRecipientEmail();
    const resendClient = await getResendClient();

    // Send email via Resend using shared templates
    const { error } = await resendClient.emails.send({
      from: `Contact Form <contact@${domain}>`,
      to: recipientEmail,
      replyTo: sanitizedEmail,
      subject: `Contact Form: ${data.name}`,
      html: createContactEmailHtml({ data, domain }),
      text: createContactEmailText({ data, domain }),
    });

    if (error) {
      console.error("Resend error:", error);
      // Error is logged above for debugging; throw generic message to avoid leaking details
      throw new Error("Email delivery failed", { cause: error });
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    // Log full error details for debugging but don't expose to client
    console.error("Error processing contact form:", error);

    if (error instanceof SyntaxError) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: "Invalid request format",
          message: "The request body must be valid JSON",
        }),
      };
    }

    // Return generic error message to avoid leaking internal details
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: "Failed to send message",
        message: "An unexpected error occurred. Please try again later.",
      }),
    };
  }
};
